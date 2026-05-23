import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, _args: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await _args.params); }
export async function POST(req: NextRequest, _args: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await _args.params); }
export async function PUT(req: NextRequest, _args: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await _args.params); }
export async function PATCH(req: NextRequest, _args: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await _args.params); }
export async function DELETE(req: NextRequest, _args: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await _args.params); }
export async function OPTIONS(req: NextRequest, _args: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, await _args.params); }

async function proxyRequest(req: NextRequest, _params: { path: string[] }) {
  // Keep backend base path (for example "/api") and retry common hosted variants.
  const targetHost = process.env.PROXY_TARGET_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://dhamma-backend.vercel.app';
  const forwardPath = (_params.path || []).join('/');

  const configured = new URL(targetHost);
  const configuredBasePath = configured.pathname.replace(/\/$/, '');
  const candidateBasePaths = Array.from(new Set([
    configuredBasePath,
    ...(configuredBasePath ? [] : ['/api']),
    ...(configuredBasePath === '/api' ? [''] : []),
  ]));

  const candidateUrls = candidateBasePaths.map((basePath) => {
    const candidate = new URL(targetHost);
    const mergedPath = `${basePath}/${forwardPath}`.replace(/\/+/g, '/');
    candidate.pathname = mergedPath.startsWith('/') ? mergedPath : `/${mergedPath}`;
    candidate.search = req.nextUrl.search;
    return candidate.toString();
  });

  const headers = new Headers(req.headers);
  headers.delete('host'); // Let fetch set the correct host header
  headers.delete('connection');

  try {
    const isBodyAllowed = !['GET', 'HEAD'].includes(req.method);
    const requestBody = isBodyAllowed ? await req.arrayBuffer() : undefined;
    let response: Response | null = null;

    for (let i = 0; i < candidateUrls.length; i++) {
      const candidateUrl = candidateUrls[i];
      const attempted = await fetch(candidateUrl, {
        method: req.method,
        headers,
        body: requestBody,
        redirect: 'manual',
      });

      response = attempted;
      if (attempted.status !== 404 || i === candidateUrls.length - 1) {
        break;
      }
    }

    if (!response) {
      return new Response(JSON.stringify({ error: 'Proxy Request Failed', details: 'No response from backend candidates' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
