import { NextResponse } from 'next/server';

const DEV_LICENSE_MODE = process.env.NEXT_PUBLIC_DEV_LICENSE_MODE ?? 'bypass';
const ALLOW_ANY_LICENSE_IN_DEV = process.env.NODE_ENV === 'development' && DEV_LICENSE_MODE === 'accept-any';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { licenseKey } = body;

    if (ALLOW_ANY_LICENSE_IN_DEV) {
      const normalized = typeof licenseKey === 'string' ? licenseKey.trim() : '';

      if (!normalized) {
        return NextResponse.json({ valid: false, error: 'License key is required.' }, { status: 400 });
      }

      return NextResponse.json({ valid: true, mode: 'development-accept-any' });
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: licenseKey,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('License validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}