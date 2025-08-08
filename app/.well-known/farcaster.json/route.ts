import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    
      "accountAssociation": {
        "header": "eyJmaWQiOjI0OTcwMiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEVCNDRFYTBlODBhQzE4MjIwREM5RjY0MjEyRWI3OTAwMzAwMTAxNjUifQ",
        "payload": "eyJkb21haW4iOiJjaGFpbi1jcnVzaC1ibGFjay52ZXJjZWwuYXBwIn0",
        "signature": "MHhlNmM4YzlkNjBhMTJlZTE0NDhmZWEyYjAxODljOTQ2MmEyYjgyNWE1NTQ2N2U1ZGM4N2NjMDM4NzMxNGI4Mzg0NzdmNjZhOWIwYTFlZGE4NWQ4NWQ3YjhiY2E0M2VkOTE1Y2ZhNWQ3YzMwZjU5YTM0NmQ2NDQ1NjlhZWZhNzMzYTFj"
      },
    
    frame: {
      version: "1",
      name: "Chain Crush",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["arbitrum", "farcaster", "miniapp", "games"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
      subtitle: "Chain Crush",
      description: "Play and Earn",
      tagline:"Play and Earn",
      ogTitle:"Chain Crush",
      ogDescription: "Play and Earn",
      ogImageUrl: `${APP_URL}/images/feed.png`,
      heroImageUrl: `${APP_URL}/images/feed.png`,
      requiredChains: ["eip155:42161"],
    },
  };

  return NextResponse.json(farcasterConfig);
}
