import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/components/providers'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chain Crush',
  description: 'A fun Game on arbitrum',
  icons: {
    icon: [
      { url: '/images/icon.jpg', sizes: '32x32', type: 'image/png' },
      { url: '/images/icon.jpg', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/images/icon.jpg',
    apple: '/images/icon.jpg',
  },
  other: {
    'msapplication-TileImage': '/images/icon.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
