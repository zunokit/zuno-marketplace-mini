import { NextRequest, NextResponse } from 'next/server';
import { ZunoSDK } from 'zuno-marketplace-sdk';
import { ethers } from 'ethers';
import { defaultConfig } from '@/lib/config/zuno-sdk';

const ERC721_ABI = ['function ownerOf(uint256 tokenId) view returns (address)'];
const ERC1155_ABI = ['function balanceOf(address account, uint256 id) view returns (uint256)'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('collection');
  const user = searchParams.get('user');

  if (!collection || !user) {
    return NextResponse.json({ error: 'Missing collection or user' }, { status: 400 });
  }

  try {
    const sdk = new ZunoSDK(defaultConfig);
    const mintedTokens = await sdk.collection.getUserMintedTokens(collection, user);
    
    if (mintedTokens.length === 0) {
      return NextResponse.json([]);
    }

    // Verify current ownership
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Try ERC721 first
    const erc721Contract = new ethers.Contract(collection, ERC721_ABI, provider);
    const erc1155Contract = new ethers.Contract(collection, ERC1155_ABI, provider);
    
    const ownedTokens: Array<{ tokenId: string; amount: number }> = [];
    
    for (const token of mintedTokens) {
      try {
        // Try ERC721 ownerOf
        const owner = await erc721Contract.ownerOf(token.tokenId);
        if (owner.toLowerCase() === user.toLowerCase()) {
          ownedTokens.push({ tokenId: token.tokenId, amount: 1 });
        }
      } catch {
        // Fallback to ERC1155 balanceOf
        try {
          const balance = await erc1155Contract.balanceOf(user, token.tokenId);
          if (balance > 0n) {
            ownedTokens.push({ tokenId: token.tokenId, amount: Number(balance) });
          }
        } catch {
          // Skip this token
        }
      }
    }
    
    return NextResponse.json(ownedTokens);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
