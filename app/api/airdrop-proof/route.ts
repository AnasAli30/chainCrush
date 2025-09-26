import { NextRequest, NextResponse } from 'next/server';

const AIRDROP_API = "https://www.clanker.world/api/airdrops/claim";
const TOKEN_ADDRESS = "0xe461003e78a7bf4f14f0d30b3ac490701980ab07";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const claimerAddress = searchParams.get('claimerAddress');

    if (!claimerAddress) {
      return NextResponse.json(
        { error: 'Claimer address is required' },
        { status: 400 }
      );
    }

    // Call Clanker API to get proof
    const clankerUrl = `${AIRDROP_API}?tokenAddress=${TOKEN_ADDRESS}&claimerAddress=${claimerAddress}`;
    
    const response = await fetch(clankerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch proof from Clanker API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract proof from the response
    if (data.proofs && data.proofs.length > 0) {
      const proofData = data.proofs[0];
      return NextResponse.json({
        success: true,
        proof: proofData.proof,
        amount: proofData.entry.amount,
        account: proofData.entry.account
      });
    } else {
      return NextResponse.json(
        { error: 'No proof found for this address' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error fetching airdrop proof:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
