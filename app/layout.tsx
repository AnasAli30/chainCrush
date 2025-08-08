import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'

import { Providers } from '@/components/providers'
import './globals.css'

const ThemeProvider = dynamic(() => import('@/components/ThemeProvider').then(mod => ({ default: mod.ThemeProvider })), {
  ssr: false,
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chain Crush',
  description: 'A fun Game on arbitrum',
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
