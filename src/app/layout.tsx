import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata: Metadata = {
  title: 'LisaStudio',
  description: 'Create and manage SCORM packages with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{fontFamily: 'system-ui, sans-serif'}}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
