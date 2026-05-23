import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAMES = ['accessToken', 'auth_token', 'userRole'];

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, cleared: AUTH_COOKIE_NAMES.length },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );

    const allCookies = req.cookies.getAll();
    const cookieNames = new Set<string>(AUTH_COOKIE_NAMES);

    for (const cookie of allCookies) {
      cookieNames.add(cookie.name);
    }

    const expired = new Date(0);
    for (const name of cookieNames) {
      response.cookies.set({
        name,
        value: '',
        path: '/',
        expires: expired,
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
