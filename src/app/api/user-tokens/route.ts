import { NextRequest, NextResponse } from 'next/server';
import { ZunoSDK } from 'zuno-marketplace-sdk';
import { defaultConfig } from '@/lib/config/zuno-sdk';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection');
  const user = searchParams.get('user');

  console.log('=== API /user-tokens START ===', {
    collection,
    user,
    timestamp: new Date().toISOString()
  });

  if (!collection || !user) {
    console.error('[API /user-tokens] Missing parameters');
    return NextResponse.json({ error: 'Missing collection or user' }, { status: 400 });
  }

  try {
    console.log('[API /user-tokens] Initializing SDK...');
    const sdk = new ZunoSDK(defaultConfig);
    console.log('[API /user-tokens] SDK initialized, calling getUserOwnedTokens...');
    const startTime = Date.now();
    const tokens = await sdk.collection.getUserOwnedTokens(collection, user);
    const duration = Date.now() - startTime;
    console.log('=== API /user-tokens SUCCESS ===', {
      tokensCount: tokens.length,
      tokens,
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('=== API /user-tokens ERROR ===', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json([], { status: 200 });
  }
}
