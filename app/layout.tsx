import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'SoftTalent',
  description: 'Plateforme de gestion intelligente du recrutement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${plusJakartaSans.variable} font-dm antialiased bg-[#F8FAFC]`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
