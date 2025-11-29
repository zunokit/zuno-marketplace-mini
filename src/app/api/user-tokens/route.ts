import { NextRequest, NextResponse } from 'next/server';
import { ZunoSDK } from 'zuno-marketplace-sdk';
import { defaultConfig } from '@/lib/config/zuno-sdk';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection');
  const user = searchParams.get('user');

  if (!collection || !user) {
    return NextResponse.json({ error: 'Missing collection or user' }, { status: 400 });
  }

  try {
    const sdk = new ZunoSDK(defaultConfig);
    const tokens = await sdk.collection.getUserMintedTokens(collection, user);
    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
