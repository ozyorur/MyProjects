import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ReceiptFormPage } from './pages/ReceiptFormPage'
import { ReceiptsListPage } from './pages/ReceiptsListPage'
import { ReceiptDetailPage } from './pages/ReceiptDetailPage'
import { ReportsPage } from './pages/ReportsPage'
import { BackupPage } from './pages/BackupPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/fis-ekle" element={<ReceiptFormPage />} />
          <Route path="/fis-duzenle/:id" element={<ReceiptFormPage />} />
          <Route path="/fisler" element={<ReceiptsListPage />} />
          <Route path="/fisler/:id" element={<ReceiptDetailPage />} />
          <Route path="/raporlar" element={<ReportsPage />} />
          <Route path="/yedek" element={<BackupPage />} />
          <Route path="/ayarlar" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
