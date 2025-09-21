import { NextRequest, NextResponse } from 'next/server';
import { getUserStreakData } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    const fidNumber = parseInt(fid);
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    const streakData = await getUserStreakData(fidNumber);
    
    if (!streakData) {
      return NextResponse.json({ 
        dailyStreak: 0, 
        longestStreak: 0, 
        lastPlayDate: null 
      });
    }

    return NextResponse.json(streakData);
  } catch (error) {
    console.error('Error fetching user streak data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
