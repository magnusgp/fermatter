import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentsPage from '@/pages/DocumentsPage'
import EditorPage from '@/pages/EditorPage'
import LibraryPage from '@/pages/LibraryPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor/:documentId" element={<EditorPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

