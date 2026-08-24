import { useEffect, type ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ title, children, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-10"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="card w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="modal-title" className="text-sm font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="btn text-xs focus-ring">
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
