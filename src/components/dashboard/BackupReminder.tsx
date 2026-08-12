import { Link } from 'react-router-dom'
import { IconAlert, IconClose } from '../ui/icons'
import { daysBetween } from '../../utils/date'
import { updateSettings } from '../../services/metaRepository'

interface BackupReminderProps {
  lastBackupAt?: string
  dismissedAt?: string
  onDismiss: () => void
}

export function BackupReminder({ lastBackupAt, dismissedAt, onDismiss }: BackupReminderProps) {
  const today = new Date().toISOString().slice(0, 10)
  const days = lastBackupAt ? daysBetween(lastBackupAt.slice(0, 10), today) : null

  if (days !== null && days <= 7) return null
  if (dismissedAt && daysBetween(dismissedAt.slice(0, 10), today) < 1) return null

  const message =
    days === null ? 'Henüz hiç yedek almadınız.' : `${days} gündür yedek alınmadı.`

  const handleDismiss = async () => {
    await updateSettings({ backupReminderDismissedAt: new Date().toISOString() })
    onDismiss()
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
      <div className="flex items-center gap-2.5">
        <IconAlert width={18} height={18} className="shrink-0" />
        <span className="text-sm font-medium">
          {message}{' '}
          <Link to="/yedek" className="underline decoration-2 underline-offset-2">
            Şimdi yedek al
          </Link>
        </span>
      </div>
      <button onClick={handleDismiss} className="shrink-0 rounded-full p-1 hover:bg-amber-100 dark:hover:bg-amber-900/50">
        <IconClose width={16} height={16} />
      </button>
    </div>
  )
}
