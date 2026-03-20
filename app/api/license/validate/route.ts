import { NextResponse } from 'next/server';

const DEV_LICENSE_MODE = process.env.NEXT_PUBLIC_DEV_LICENSE_MODE ?? 'bypass';
const ALLOW_ANY_LICENSE_IN_DEV = process.env.NODE_ENV === 'development' && DEV_LICENSE_MODE === 'accept-any';
const UPSTREAM_TIMEOUT_MS = 8000;

function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'Invalid license key.';
  }

  const record = data as Record<string, unknown>;

  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error;
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  return 'Invalid license key.';
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rawKey =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>).licenseKey
        : '';
    const licenseKey = typeof rawKey === 'string' ? rawKey.trim() : '';

    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, error: 'License key is required.' },
        { status: 400 }
      );
    }

    if (ALLOW_ANY_LICENSE_IN_DEV) {
      return NextResponse.json({ valid: true, mode: 'development-accept-any' });
    }

    if (!process.env.LEMON_SQUEEZY_API_KEY) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Activation service is not configured. Please contact support.',
        },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: licenseKey,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          {
            valid: false,
            error: 'Validation timed out. Please try again.',
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        {
          valid: false,
          error: 'Could not reach activation service. Please try again.',
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json().catch(() => null);

    if (
      response.ok &&
      data &&
      typeof data === 'object' &&
      (data as Record<string, unknown>).valid === true
    ) {
      return NextResponse.json({ valid: true });
    }

    const message = extractErrorMessage(data);

    return NextResponse.json(
      {
        valid: false,
        error: message,
      },
      { status: response.ok ? 400 : response.status }
    );
  } catch (error) {
    console.error('License validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}