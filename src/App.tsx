import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './admin/auth'
import { RequireAuth } from './admin/RequireAuth'
import { AdminLayout } from './admin/AdminLayout'
import { AdminLogin } from './admin/AdminLogin'
import { Dashboard } from './admin/Dashboard'
import { HomepageEditor } from './admin/HomepageEditor'
import { ResourcePage } from './admin/ResourcePage'
import { MessagesPage } from './admin/MessagesPage'
import { NewsletterPage } from './admin/NewsletterPage'
import { MediaPage } from './admin/MediaPage'
import { SettingsPage } from './admin/SettingsPage'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="homepage" element={<HomepageEditor />} />
            <Route path="programs" element={<ResourcePage collection="programs" />} />
            <Route path="research" element={<ResourcePage collection="insights" title="Research" />} />
            <Route path="nutrition" element={<ResourcePage collection="nutrition" />} />
            <Route path="impact" element={<ResourcePage collection="stories" title="Impact stories" />} />
            <Route path="regions" element={<ResourcePage collection="locations" title="Regions" />} />
            <Route path="field-notes" element={<ResourcePage collection="insights" title="Field notes" />} />
            <Route path="hero" element={<ResourcePage collection="hero-slides" title="Hero slides" />} />
            <Route path="events" element={<ResourcePage collection="events" />} />
            <Route path="faq" element={<ResourcePage collection="faq" />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="newsletter" element={<NewsletterPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
