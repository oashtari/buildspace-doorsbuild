import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_STAKE_PROGRAM_ID ?? '')

// 217. 
export const STAKE_MINT = new PublicKey(process.env.NEXT_PUBLIC_STAKE_MINT_ADDRESS ?? '')