import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE =
  process.env.NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL ?? "http://localhost:3001";

function buildTargetUrl(path: string[], searchParams: URLSearchParams): string {
  const normalizedPath = path.join("/");
  const url = new URL(`${API_BASE.replace(/\/$/, "")}/${normalizedPath}`);
  for (const [k, v] of searchParams.entries()) {
    url.searchParams.append(k, v);
  }
  return url.toString();
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const targetUrl = buildTargetUrl(path, request.nextUrl.searchParams);

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("cache-control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reach Mission Control API";

    return Response.json(
      {
        error: "UPSTREAM_UNAVAILABLE",
        message,
        apiBaseUrl: API_BASE,
      },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  return proxy(request, path);
}
