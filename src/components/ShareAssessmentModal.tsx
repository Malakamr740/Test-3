import { useState, useEffect } from 'react'
import { Globe, RefreshCw, Check, Copy, ExternalLink, QrCode } from 'lucide-react'

interface ShareAssessmentModalProps {
  assessmentId: string
  assessmentName: string
  isOpen?: boolean
  onClose: () => void
}

const STORAGE_CUSTOM_ORIGIN_KEY = 'math_diag_hosting_origin'

export default function ShareAssessmentModal({
  assessmentId,
  assessmentName,
  isOpen = true,
  onClose,
}: ShareAssessmentModalProps) {
  const [copied, setCopied] = useState(false)
  const [customOrigin, setCustomOrigin] = useState<string>(() => {
    return localStorage.getItem(STORAGE_CUSTOM_ORIGIN_KEY) || ''
  })
  const [isEditingOrigin, setIsEditingOrigin] = useState(false)
  const [originInput, setOriginInput] = useState('')

  // Dynamically resolve current host origin in browser (e.g. https://xxx.vercel.app)
  const liveOrigin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin.replace(/\/+$/, '')
    : ''

  useEffect(() => {
    setOriginInput(customOrigin || liveOrigin)
  }, [customOrigin, liveOrigin])

  if (!isOpen) return null

  // Effective origin: custom override if user specifically set one, otherwise dynamic live window.location.origin
  const effectiveOrigin = (customOrigin.trim() || liveOrigin).replace(/\/+$/, '')
  const shareUrl = `${effectiveOrigin}/assessment/${assessmentId}`
  const whatsappMessage = encodeURIComponent(
    `Hello! Please complete the diagnostic assessment "${assessmentName}" by visiting this link: ${shareUrl}`
  )
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    shareUrl
  )}`

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleSaveCustomOrigin() {
    let clean = originInput.trim().replace(/\/+$/, '')
    if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    if (!clean || clean === liveOrigin) {
      localStorage.removeItem(STORAGE_CUSTOM_ORIGIN_KEY)
      setCustomOrigin('')
    } else {
      localStorage.setItem(STORAGE_CUSTOM_ORIGIN_KEY, clean)
      setCustomOrigin(clean)
    }
    setIsEditingOrigin(false)
  }

  function handleResetToCurrentOrigin() {
    localStorage.removeItem(STORAGE_CUSTOM_ORIGIN_KEY)
    setCustomOrigin('')
    setOriginInput(liveOrigin)
    setIsEditingOrigin(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
    >
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <QrCode className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Share Diagnostic Test</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Real-time link &amp; QR code automatically synchronized with your current hosting deployment.
          </p>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Public Test Link
              </label>
              <button
                type="button"
                onClick={() => setIsEditingOrigin(!isEditingOrigin)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Globe className="h-3 w-3" />
                <span>{customOrigin ? 'Custom Domain Set' : 'Configure Domain'}</span>
              </button>
            </div>

            {isEditingOrigin && (
              <div className="mb-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Deployment / Hosting Origin</span>
                  <button
                    type="button"
                    onClick={handleResetToCurrentOrigin}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>Auto-sync current host</span>
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={originInput}
                    onChange={(e) => setOriginInput(e.target.value)}
                    placeholder="https://your-math-platform.vercel.app"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomOrigin}
                    className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Automatically adapts to Vercel, Netlify, or any production URL where the platform is hosted.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition flex items-center gap-1.5 cursor-pointer ${
                  copied ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
            >
              <span>💬</span>
              <span>Share WhatsApp</span>
            </a>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Student Page</span>
            </a>
          </div>

          {/* Live QR Code */}
          <div className="border-t border-slate-100 pt-4 mt-3 text-center">
            <p className="text-xs font-semibold text-slate-600 mb-2.5">
              Live Scannable QR Code
            </p>
            <div className="inline-block p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <img
                src={qrCodeUrl}
                alt="Assessment QR Code"
                className="w-44 h-44 mx-auto rounded-lg"
                loading="lazy"
              />
            </div>
            {effectiveOrigin && (
              <p className="text-[11px] text-slate-500 mt-2 font-mono truncate px-4">
                {effectiveOrigin}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
