import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    
      "accountAssociation": {
        "header": "eyJmaWQiOjI0OTcwMiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweGU2Q2ZkQWY3NGJGRUMwMEZhZmRFOTcyNEE0NmNiMDUyNTQ4Qzg0ODgifQ",
        "payload": "eyJkb21haW4iOiJjaGFpbi1jcnVzaC1ibGFjay52ZXJjZWwuYXBwIn0",
        "signature": "wUGluVP+21iWt0XUaYBx6sxk1Jtn51YDyq/sSC6cTUsqsLbcNzbFIqMqvBxgbE2Yqie4xBhgqVo6qKNdSsSO0Bs="
      },
    
    frame: {
      version: "1",
      name: "Chain Crush",
      iconUrl: `${APP_URL}/images/icon.jpg`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["arbitrum", "farcaster", "miniapp", "games"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
      subtitle: "Chain Crush",
      description: "Play. Crush. Earn.",
      tagline:"Play and Earn",
      ogTitle:"Chain Crush",
      ogDescription: "Play and Earn",
      ogImageUrl: `${APP_URL}/images/feed.jpg`,
      heroImageUrl: `${APP_URL}/images/feed.jpg`,
      requiredChains: ["eip155:42161"],
    },
    "baseBuilder": {
      "allowedAddresses": ["0xE7503b8d192DcE2895327878ECE5a0a401821a66"]
    }
  };

  return NextResponse.json(farcasterConfig);
}
