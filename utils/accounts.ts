// // 211. this is pasted from ts/src/utils/accounts.ts in the nft staking project
// // need to install borsh so it can be imported  

// // import { AccountInfo, Connection, PublicKey } from "@solana/web3.js"
// // import { PROGRAM_ID } from "./constants"
// // import * as borsh from "@project-serum/borsh"

// // const userStakeAccountLayout = borsh.struct([
// //   borsh.bool("isInitialized"),
// //   borsh.publicKey("tokenAccount"),
// //   borsh.i64("stakeStartTime"),
// //   borsh.i64("lastRedeem"),
// //   borsh.publicKey("userPubkey"),
// //   borsh.u8("state"),
// // ])

// // export async function getStakeAccount(
// //   connection: Connection,
// //   user: PublicKey,
// //   tokenAccount: PublicKey
// // ): Promise<any> {
// //   const [accountPubkey] = PublicKey.findProgramAddressSync(
// //     [user.toBuffer(), tokenAccount.toBuffer()],
// //     PROGRAM_ID
// //   )
// //   const account = await connection.getAccountInfo(accountPubkey)
// //   if (!account) throw {}
// //   console.log(account.data)
// //   return userStakeAccountLayout.decode(account.data)
// // }


// // 311. NEW ANCHOR VERSION
// import { PublicKey } from "@solana/web3.js"

// export async function getStakeAccount(
//   program: any,
//   user: PublicKey, 
//   tokenAccount: PublicKey,
// ): Promise<any> {
//   const [pda] = PublicKey.findProgramAddressSync(
//     [user.toBuffer(),tokenAccount.toBuffer()],
//     program.prgoramId
//   )
//   const account  = await program.account.userStakeInfo.fetch(pda)
//   return account
// }


import { token } from "@metaplex-foundation/js"
import { BN } from "@project-serum/anchor"
import { PublicKey } from "@solana/web3.js"

export async function getStakeAccount(
  program: any,
  user: PublicKey,
  tokenAccount: PublicKey
): Promise<StakeAccount> {
  const [pda] = PublicKey.findProgramAddressSync(
    [user.toBuffer(), tokenAccount.toBuffer()],
    program.programId
  )
  try {
    const account = await program.account.userStakeInfo.fetch(pda)
    return new StakeAccount(account)
  } catch (e) {
    console.log(e)
    throw e
  }
}

export class StakeAccount {
  tokenAccount: PublicKey
  stakeStartTime: BN
  lastStakeRedeem: BN
  totalEarned: BN
  stakeState: { staked: boolean; unstaked: boolean }
  isInitialized: boolean

  constructor(params: {
    tokenAccount: PublicKey
    stakeStartTime: BN
    lastStakeRedeem: BN
    totalEarned: BN
    stakeState: { staked: boolean; unstaked: boolean }
    isInitialized: boolean
  }) {
    this.totalEarned = params.totalEarned
    this.tokenAccount = params.tokenAccount
    this.stakeStartTime = params.stakeStartTime
    this.lastStakeRedeem = params.lastStakeRedeem
    this.stakeState = params.stakeState
    this.isInitialized = params.isInitialized
  }

  daysStaked(): number {
    const seconds = new BN(Date.now() / 1000)
      .sub(this.stakeStartTime)
      .toNumber()

    return seconds / (24 * 60 * 60)
  }

  claimable(): number {
    const seconds = new BN(Date.now() / 1000)
      .sub(this.lastStakeRedeem)
      .toNumber()

    return 10 * (seconds / (24 * 60 * 60))
  }
}