import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Delete every single cookie stored on the frontend domain
    for (const cookie of allCookies) {
      cookieStore.delete(cookie.name);
    }
    
    return NextResponse.json({ success: true, cleared: allCookies.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
