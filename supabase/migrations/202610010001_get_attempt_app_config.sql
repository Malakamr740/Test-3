create or replace function public.get_attempt_app_config(
  p_attempt_id uuid,
  p_resume_token uuid,
  p_config_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_config jsonb;
begin
  if p_config_key not in ('report_template', 'survey_questions', 'action_plans') then
    raise exception 'Unsupported app configuration key.';
  end if;

  if not exists (
    select 1
    from attempts a
    where a.id = p_attempt_id
      and a.resume_token = p_resume_token
      and a.status = 'completed'
  ) then
    raise exception 'Invalid attempt or resume token.';
  end if;

  select config.config_data
  into v_config
  from attempts a
  join organization_app_configs config
    on config.organization_id = a.organization_id
   and config.config_key = p_config_key
   and (config.assessment_id = a.assessment_id or config.assessment_id is null)
  where a.id = p_attempt_id
  order by (config.assessment_id is not null) desc
  limit 1;

  return v_config;
end;
$function$;

revoke all on function public.get_attempt_app_config(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.get_attempt_app_config(uuid, uuid, text)
  to anon, authenticated;