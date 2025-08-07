import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: 'Play ChainCrush',
    action: {
      type: 'launch_frame',
      name: 'ChainCrush - Candy Crush Game',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#ff69b4',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ChainCrush - Candy Crush Game',
    openGraph: {
      title: 'ChainCrush - Candy Crush Game',
      description: 'The sweetest Candy Crush game on Farcaster!',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
