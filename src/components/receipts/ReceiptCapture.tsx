import { useRef } from 'react'
import { IconCamera, IconFile, IconGallery } from '../ui/icons'

interface ReceiptCaptureProps {
  onFileSelected: (file: File) => void
  onSkip?: () => void
}

const ACCEPTED_IMAGE = 'image/jpeg,image/jpg,image/png,image/webp'
const ACCEPTED_ALL = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf'

export function ReceiptCapture({ onFileSelected, onSkip }: ReceiptCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
    e.target.value = ''
  }

  return (
    <div className="card p-5 md:p-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
          <IconCamera width={30} height={30} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fiş Ekle</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Fişin fotoğrafını çekin veya bir görsel/PDF yükleyin. Bilgiler otomatik okunmaya çalışılacak, dilediğiniz gibi düzenleyebilirsiniz.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button className="btn-primary flex-col !py-5" onClick={() => cameraRef.current?.click()}>
            <IconCamera width={24} height={24} />
            <span>Fotoğraf Çek</span>
          </button>
          <button className="btn-secondary flex-col !py-5" onClick={() => galleryRef.current?.click()}>
            <IconGallery width={24} height={24} />
            <span>Galeriden Seç</span>
          </button>
          <button className="btn-secondary flex-col !py-5" onClick={() => fileRef.current?.click()}>
            <IconFile width={24} height={24} />
            <span>Dosyadan Seç</span>
          </button>
        </div>

        <input ref={cameraRef} type="file" accept={ACCEPTED_IMAGE} capture="environment" className="hidden" onChange={handleChange} />
        <input ref={galleryRef} type="file" accept={ACCEPTED_IMAGE} className="hidden" onChange={handleChange} />
        <input ref={fileRef} type="file" accept={ACCEPTED_ALL} className="hidden" onChange={handleChange} />

        {onSkip && (
          <button onClick={onSkip} className="mt-5 text-sm font-medium text-slate-400 underline decoration-slate-300 underline-offset-4 hover:text-slate-600 dark:hover:text-slate-300">
            Fotoğrafsız devam et, manuel gir
          </button>
        )}
      </div>
    </div>
  )
}
