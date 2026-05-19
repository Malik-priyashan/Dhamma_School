import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await params); }
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await params); }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await params); }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await params); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await params); }
export async function OPTIONS(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await params); }

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  // Use the explicitly provided target URL or default back to whatever the backend URL was originally
  const targetHost = process.env.PROXY_TARGET_BACKEND_URL || 'https://dhamma-backend.vercel.app'; 
  
  const targetUrl = new URL(req.nextUrl.pathname.replace(/^\/api\/proxy/, ''), targetHost);
  targetUrl.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  headers.delete('host'); // Let fetch set the correct host header
  headers.delete('connection');

  try {
    const isBodyAllowed = !['GET', 'HEAD'].includes(req.method);
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: isBodyAllowed ? await req.arrayBuffer() : undefined,
      redirect: 'manual',
    });

    const proxyHeaders = new Headers(response.headers);
    
    // THIS IS THE CRUCIAL PART FOR SAFARI:
    // Strip the "Domain=..." restriction from Set-Cookie headers 
    // so Safari accepts it as a first-party cookie on the frontend domain.
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      proxyHeaders.delete('set-cookie');
      for (const cookie of setCookieHeaders) {
        let newCookie = cookie.replace(/Domain=[^;]+;?\s*/gi, '');
        newCookie = newCookie.replace(/SameSite=None;?\s*/gi, 'SameSite=Lax; '); // Safari favors Lax for first-party
        proxyHeaders.append('set-cookie', newCookie);
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: proxyHeaders,
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Proxy Request Failed', details: String(error) }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
