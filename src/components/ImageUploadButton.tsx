import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

interface ImageUploadButtonProps {
  onUploaded: (url: string) => void
}

export default function ImageUploadButton({ onUploaded }: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    // Give each upload a unique file path so two teachers uploading
    // "graph.png" at the same time never overwrite each other.
    const fileExt = file.name.split('.').pop()
    const uniquePath = `${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(uniquePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    // getPublicUrl doesn't make a network request — it just builds
    // the correct URL string for a file in a public bucket.
    const { data } = supabase.storage.from('question-images').getPublicUrl(uniquePath)

    onUploaded(data.publicUrl)
    setUploading(false)

    // Reset the input so the same file could be re-selected later if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        disabled={uploading}
        className="text-sm"
      />
      {uploading && <p className="text-xs text-slate-500 mt-1">Uploading...</p>}
      {error && <p className="text-xs text-red-600 mt-1">Upload failed: {error}</p>}
    </div>
  )
}