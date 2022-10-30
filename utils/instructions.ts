// this is a copy of the entire ts/src/utils/instructions file in nft-staking 
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import { LootboxProgram } from "./lootbox_program"
import { Program, BorshInstructionCoder, BN } from "@project-serum/anchor"
import {
  PermissionAccount,
  ProgramStateAccount,
  OracleQueueAccount,
  SwitchboardProgram,
} from "@switchboard-xyz/switchboard-v2"
import * as spl from "@solana/spl-token"
import { STAKE_MINT } from "./constants"
import { AnchorNftStaking } from "./anchor_nft_staking"

export async function createOpenLootboxInstructions(
  connection: Connection,
  stakingProgram: Program<AnchorNftStaking>,
  switchboardProgram: SwitchboardProgram,
  lootboxProgram: Program<LootboxProgram>,
  userPubkey: PublicKey,
  nftTokenAccount: PublicKey,
  box: number
): Promise<TransactionInstruction[]> {
  const [userStatePda] = PublicKey.findProgramAddressSync(
    [userPubkey.toBytes()],
    lootboxProgram.programId
  )

  const state = await lootboxProgram.account.userState.fetch(userStatePda)

  const accounts = await getAccountsAndData(
    lootboxProgram,
    switchboardProgram,
    userPubkey,
    state.vrf
  )

  return await createAllOpenLootboxInstructions(
    connection,
    stakingProgram,
    lootboxProgram,
    switchboardProgram,
    accounts,
    nftTokenAccount,
    box
  )
}

export async function createInitSwitchboardInstructions(
  switchboardProgram: SwitchboardProgram,
  lootboxProgram: Program<LootboxProgram>,
  userPubkey: PublicKey
): Promise<{
  instructions: Array<TransactionInstruction>
  vrfKeypair: Keypair
}> {
  const vrfKeypair = Keypair.generate()

  const accounts = await getAccountsAndData(
    lootboxProgram,
    switchboardProgram,
    userPubkey,
    vrfKeypair.publicKey
  )

  const initInstructions = await initSwitchboardLootboxUser(
    switchboardProgram,
    lootboxProgram,
    accounts,
    vrfKeypair
  )

  return { instructions: initInstructions, vrfKeypair: vrfKeypair }
}

async function getAccountsAndData(
  lootboxProgram: Program<LootboxProgram>,
  switchboardProgram: SwitchboardProgram,
  userPubkey: PublicKey,
  vrfAccount: PublicKey
): Promise<AccountsAndDataSuperset> {
  const [userStatePda] = PublicKey.findProgramAddressSync(
    [userPubkey.toBytes()],
    lootboxProgram.programId
  )

  // required switchboard accoount
  const [programStateAccount, stateBump] =
    ProgramStateAccount.fromSeed(switchboardProgram)

  // required switchboard accoount
  const queueAccount = new OracleQueueAccount({
    program: switchboardProgram,
    // devnet permissionless queue
    publicKey: new PublicKey("F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy"),
  })

  // required switchboard accoount
  const queueState = await queueAccount.loadData()
  // wrapped SOL is used to pay for switchboard VRF requests
  const wrappedSOLMint = await queueAccount.loadMint()

  // required switchboard accoount
  const [permissionAccount, permissionBump] = PermissionAccount.fromSeed(
    switchboardProgram,
    queueState.authority,
    queueAccount.publicKey,
    vrfAccount
  )

  // required switchboard accoount
  // escrow wrapped SOL token account owned by the VRF account we will initialize
  const escrow = await spl.getAssociatedTokenAddress(
    wrappedSOLMint.address,
    vrfAccount,
    true
  )

  const size = switchboardProgram.account.vrfAccountData.size

  return {
    userPubkey: userPubkey,
    userStatePda: userStatePda,
    vrfAccount: vrfAccount,
    escrow: escrow,
    wrappedSOLMint: wrappedSOLMint,
    programStateAccount: programStateAccount,
    stateBump: stateBump,
    permissionBump: permissionBump,
    queueAccount: queueAccount,
    queueState: queueState,
    permissionAccount: permissionAccount,
    size: size,
  }
}

async function initSwitchboardLootboxUser(
  switchboardProgram: SwitchboardProgram,
  lootboxProgram: Program<LootboxProgram>,
  accountsAndData: AccountsAndDataSuperset,
  vrfKeypair: Keypair
): Promise<Array<TransactionInstruction>> {
  // lootbox account PDA
  const [lootboxPointerPda] = await PublicKey.findProgramAddress(
    [Buffer.from("lootbox"), accountsAndData.userPubkey.toBytes()],
    lootboxProgram.programId
  )

  const stateBump = accountsAndData.stateBump

  const txnIxns: TransactionInstruction[] = [
    // create escrow ATA owned by VRF account
    spl.createAssociatedTokenAccountInstruction(
      accountsAndData.userPubkey,
      accountsAndData.escrow,
      vrfKeypair.publicKey,
      accountsAndData.wrappedSOLMint.address
    ),
    // transfer escrow ATA owner to switchboard programStateAccount
    spl.createSetAuthorityInstruction(
      accountsAndData.escrow,
      vrfKeypair.publicKey,
      spl.AuthorityType.AccountOwner,
      accountsAndData.programStateAccount.publicKey,
      [vrfKeypair]
    ),
    // request system program to create new account using newly generated keypair for VRF account
    SystemProgram.createAccount({
      fromPubkey: accountsAndData.userPubkey,
      newAccountPubkey: vrfKeypair.publicKey,
      space: accountsAndData.size,
      lamports:
        await switchboardProgram.provider.connection.getMinimumBalanceForRentExemption(
          accountsAndData.size
        ),
      programId: switchboardProgram.programId,
    }),
    // initialize new VRF account, included the callback CPI into lootbox program as instruction data
    await switchboardProgram.methods
      .vrfInit({
        stateBump,
        callback: {
          programId: lootboxProgram.programId,
          accounts: [
            {
              pubkey: accountsAndData.userStatePda,
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: vrfKeypair.publicKey,
              isSigner: false,
              isWritable: false,
            },
            { pubkey: lootboxPointerPda, isSigner: false, isWritable: true },
            {
              pubkey: accountsAndData.userPubkey,
              isSigner: false,
              isWritable: false,
            },
          ],
          ixData: new BorshInstructionCoder(lootboxProgram.idl).encode(
            "consumeRandomness",
            ""
          ),
        },
      })
      .accounts({
        vrf: vrfKeypair.publicKey,
        escrow: accountsAndData.escrow,
        authority: accountsAndData.userStatePda,
        oracleQueue: accountsAndData.queueAccount.publicKey,
        programState: accountsAndData.programStateAccount.publicKey,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
      })
      .instruction(),
    // initialize switchboard permission account, required account
    await switchboardProgram.methods
      .permissionInit({})
      .accounts({
        permission: accountsAndData.permissionAccount.publicKey,
        authority: accountsAndData.queueState.authority,
        granter: accountsAndData.queueAccount.publicKey,
        grantee: vrfKeypair.publicKey,
        payer: accountsAndData.userPubkey,
        systemProgram: SystemProgram.programId,
      })
      .instruction(),
    await lootboxProgram.methods
      .initUser({
        switchboardStateBump: accountsAndData.stateBump,
        vrfPermissionBump: accountsAndData.permissionBump,
      })
      .accounts({
        // state: userStatePDA,
        vrf: vrfKeypair.publicKey,
        // payer: publicKey,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction(),
  ]

  return txnIxns
}

async function createAllOpenLootboxInstructions(
  connection: Connection,
  stakingProgram: Program<AnchorNftStaking>,
  lootboxProgram: Program<LootboxProgram>,
  switchboardProgram: SwitchboardProgram,
  accountsAndData: AccountsAndDataSuperset,
  nftTokenAccount: PublicKey,
  box: number
): Promise<TransactionInstruction[]> {
  // user Wrapped SOL token account
  // wSOL amount is then transferred to escrow account to pay switchboard oracle for VRF request
  const wrappedTokenAccount = await spl.getAssociatedTokenAddress(
    accountsAndData.wrappedSOLMint.address,
    accountsAndData.userPubkey
  )

  // user BLD token account, used to pay BLD tokens to call the request randomness instruction on Lootbox program
  const stakeTokenAccount = await spl.getAssociatedTokenAddress(
    STAKE_MINT,
    accountsAndData.userPubkey
  )

  const [stakeAccount] = PublicKey.findProgramAddressSync(
    [accountsAndData.userPubkey.toBytes(), nftTokenAccount.toBuffer()],
    stakingProgram.programId
  )

  let instructions: TransactionInstruction[] = []
  // check if a wrapped SOL token account exists, if not add instruction to create one
  const account = await connection.getAccountInfo(wrappedTokenAccount)
  if (!account) {
    instructions.push(
      spl.createAssociatedTokenAccountInstruction(
        accountsAndData.userPubkey,
        wrappedTokenAccount,
        accountsAndData.userPubkey,
        accountsAndData.wrappedSOLMint.address
      )
    )
  }

  // transfer SOL to user's own wSOL token account
  instructions.push(
    SystemProgram.transfer({
      fromPubkey: accountsAndData.userPubkey,
      toPubkey: wrappedTokenAccount,
      lamports: 0.002 * LAMPORTS_PER_SOL,
    })
  )
  // sync wrapped SOL balance
  instructions.push(spl.createSyncNativeInstruction(wrappedTokenAccount))

  // Lootbox program request randomness instruction
  instructions.push(
    await lootboxProgram.methods
      .openLootbox(new BN(box))
      .accounts({
        user: accountsAndData.userPubkey,
        stakeMint: STAKE_MINT,
        stakeMintAta: stakeTokenAccount,
        stakeState: stakeAccount,
        state: accountsAndData.userStatePda,
        vrf: accountsAndData.vrfAccount,
        oracleQueue: accountsAndData.queueAccount.publicKey,
        queueAuthority: accountsAndData.queueState.authority,
        dataBuffer: accountsAndData.queueState.dataBuffer,
        permission: accountsAndData.permissionAccount.publicKey,
        escrow: accountsAndData.escrow,
        programState: accountsAndData.programStateAccount.publicKey,
        switchboardProgram: switchboardProgram.programId,
        payerWallet: wrappedTokenAccount,
        recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
      })
      .instruction()
  )

  return instructions
}

interface AccountsAndDataSuperset {
  userPubkey: PublicKey
  userStatePda: PublicKey
  vrfAccount: PublicKey
  escrow: PublicKey
  wrappedSOLMint: spl.Mint
  programStateAccount: ProgramStateAccount
  stateBump: number
  permissionBump: number
  queueAccount: OracleQueueAccount
  queueState: any
  permissionAccount: PermissionAccount
  size: number
}




  // export function createInitializeStakeAccountInstruction(
  //   nftHolder: PublicKey,
  //   nftTokenAccount: PublicKey,
  //   programId: PublicKey
  // ): TransactionInstruction {
  //   const [stakeAccount] = PublicKey.findProgramAddressSync(
  //     [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
  //     programId
  //   )
  
  //   return new TransactionInstruction({
  //     programId: programId,
  //     keys: [
  //       {
  //         pubkey: nftHolder,
  //         isWritable: false,
  //         isSigner: true,
  //       },
  //       {
  //         pubkey: nftTokenAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: stakeAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: SystemProgram.programId,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //     ],
  //     data: Buffer.from([0]),
  //   })
  // }
  
  // // 6. need to add all the new accounts here 
  // export function createStakingInstruction(
  //   nftHolder: PublicKey,
  //   nftTokenAccount: PublicKey,
  //   // 6. 
  //   nftMint: PublicKey,
  //   nftEdition: PublicKey,
  //   tokenProgram: PublicKey,
  //   metadataProgram: PublicKey,
  //   programId: PublicKey
  // ): TransactionInstruction {
  //   const [stakeAccount] = PublicKey.findProgramAddressSync(
  //     [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
  //     programId
  //   )
  
  //   // 7.
  //   const [delegateAuthority] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("authority")],
  //     programId
  //   )
  
  //   return new TransactionInstruction({
  //     programId: programId,
  //     keys: [
  //       {
  //         pubkey: nftHolder,
  //         isWritable: false,
  //         isSigner: true,
  //       },
  //       {
  //         pubkey: nftTokenAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       // 8. mint
  //       {
  //         pubkey: nftMint,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       // 9. edition
  //       {
  //         pubkey: nftEdition,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: stakeAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       // 10. program authority -- writable
  //       {
  //         pubkey: delegateAuthority,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       // 11. token program 
  //       {
  //         pubkey: tokenProgram,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       // 12. metadata program 
  //       {
  //         pubkey: metadataProgram,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //     ],
  //     data: Buffer.from([1]),
  //   })
  // }
  
  
  // export function createRedeemInstruction(
  //   nftHolder: PublicKey,
  //   nftTokenAccount: PublicKey,
  //   // 17. 
  //   mint: PublicKey,
  //   userStakeATA: PublicKey,
  //   tokenProgram: PublicKey,
  //   programId: PublicKey
  // ): TransactionInstruction {
  //   const [stakeAccount] = PublicKey.findProgramAddressSync(
  //     [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
  //     programId
  //   )
  
  //   // 18. derive 
  //   const [mintAuth] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("mint")],
  //     programId
  //   )
  
  
  
  //   return new TransactionInstruction({
  //     programId: programId,
  //     keys: [
  //       {
  //         pubkey: nftHolder,
  //         isWritable: false,
  //         isSigner: true,
  //       },
  //       {
  //         pubkey: nftTokenAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: stakeAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       // 19.
  //       {
  //         pubkey: mint,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: mintAuth,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: userStakeATA,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: tokenProgram,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //     ],
  //     data: Buffer.from([2]),
  //   })
  // }
  
  // export function createUnstakeInstruction(
  //   nftHolder: PublicKey,
  //   nftTokenAccount: PublicKey,
  //   // 28.
  //   nftMint: PublicKey,
  //   nftEdition: PublicKey,
  //   stakeMint: PublicKey,
  //   userStakeATA: PublicKey,
  //   tokenProgram: PublicKey,
  //   metadataProgram: PublicKey,
  //   programId: PublicKey
  // ): TransactionInstruction {
  //   const [stakeAccount] = PublicKey.findProgramAddressSync(
  //     [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
  //     programId
  //   )
  
  //   // 28. 
  //   const [delegateAuthority] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("authority")],
  //     programId
  //   )
  
  //   // 28. 
  //   const [mintAuth] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("mint")],
  //     programId
  //   )
  
  //   return new TransactionInstruction({
  //     programId: programId,
  //     keys: [
  //       // 28. need to match from processor to client side here 
  //       {
  //         pubkey: nftHolder,
  //         isWritable: false,
  //         isSigner: true,
  //       },
  //       {
  //         pubkey: nftTokenAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: nftMint,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: nftEdition,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: stakeAccount,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: delegateAuthority,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: stakeMint,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: mintAuth,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: userStakeATA,
  //         isWritable: true,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: tokenProgram,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  //       {
  //         pubkey: metadataProgram,
  //         isWritable: false,
  //         isSigner: false,
  //       },
  
  
  //     ],
  //     data: Buffer.from([3]),
  //   })
  // }