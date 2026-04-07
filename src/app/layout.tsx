import type { Metadata } from 'next'
import { SiteShell } from '@/components/site-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'BarterHound',
  description: 'A local-first barter marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-stone-100 text-stone-900 antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
