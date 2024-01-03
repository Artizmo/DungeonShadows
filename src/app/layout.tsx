import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

type LayoutType = {
  children: React.ReactNode
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dungeon Shadows',
  description: 'A tabletop MMO',
}

export default function RootLayout({ children }: LayoutType) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
