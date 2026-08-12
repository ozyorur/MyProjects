import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from './icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className={`max-h-[90dvh] w-full ${sizeClasses[size]} overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl md:rounded-2xl dark:bg-slate-900`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <IconClose width={18} height={18} />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
