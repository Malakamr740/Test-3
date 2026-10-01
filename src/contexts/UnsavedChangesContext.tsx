import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { useBlocker, useBeforeUnload } from 'react-router-dom'

interface UnsavedChangesRegistration {
  id: string
  isDirty: boolean
  onSave?: () => void | Promise<void>
}

interface UnsavedChangesContextValue {
  register: (registration: UnsavedChangesRegistration) => void
  clear: (id: string) => void
  markClean: (id: string) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  register: () => {},
  clear: () => {},
  markClean: () => {},
})

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [registration, setRegistration] = useState<UnsavedChangesRegistration | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const blocker = useBlocker(Boolean(registration?.isDirty))

  useBeforeUnload(
    useCallback((event) => {
      if (!registration?.isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }, [registration?.isDirty])
  )

  const register = useCallback((next: UnsavedChangesRegistration) => {
    setRegistration((current) => {
      if (
        current?.id === next.id &&
        current.isDirty === next.isDirty &&
        current.onSave === next.onSave
      ) {
        return current
      }
      return next
    })
  }, [])

  const clear = useCallback((id: string) => {
    setRegistration((current) => current?.id === id ? null : current)
  }, [])

  const markClean = useCallback((id: string) => {
    setRegistration((current) => current?.id === id ? { ...current, isDirty: false } : current)
  }, [])

  const handleDiscard = () => {
    setRegistration(null)
    setSaveError(null)
    blocker.proceed?.()
  }

  const handleContinueEditing = () => {
    setSaveError(null)
    blocker.reset?.()
  }

  const handleSaveAndContinue = async () => {
    if (!registration?.onSave) return
    setSaving(true)
    setSaveError(null)
    try {
      await registration.onSave()
      setRegistration(null)
      blocker.proceed?.()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <UnsavedChangesContext.Provider value={{ register, clear, markClean }}>
      {children}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-changes-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <h2 id="unsaved-changes-title" className="text-base font-semibold text-slate-900">
              Unsaved changes
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Save your changes before leaving, discard them, or continue editing.
            </p>
            {saveError && <p className="mt-3 text-sm text-rose-700">{saveError}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleContinueEditing}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Continue editing
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving || !registration?.onSave}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChanges(isDirty: boolean, onSave?: () => void | Promise<void>) {
  const id = useId()
  const { register, clear, markClean } = useContext(UnsavedChangesContext)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const invokeSave = useCallback(() => onSaveRef.current?.(), [])

  useEffect(() => {
    register({ id, isDirty, onSave: invokeSave })
    return () => clear(id)
  }, [id, isDirty, invokeSave, register, clear])

  return useCallback(() => {
    markClean(id)
  }, [id, markClean])
}

export default UnsavedChangesContext