import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: 'Play ChainCrush',
    action: {
      type: 'launch_frame',
      name: 'ChainCrush - meme Crush Game',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#ff69b4',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ChainCrush - Meme Crush Game',
    openGraph: {
      title: 'ChainCrush - Meme Crush Game',
      description: 'The sweetest Meme Crush game on Farcaster!',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
