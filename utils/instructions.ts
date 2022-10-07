// this is a copy of the entire ts/src/utils/instructions file in nft-staking 

import {
    PublicKey,
    SystemProgram,
    TransactionInstruction,
  } from "@solana/web3.js"
  
  export function createInitializeStakeAccountInstruction(
    nftHolder: PublicKey,
    nftTokenAccount: PublicKey,
    programId: PublicKey
  ): TransactionInstruction {
    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
      programId
    )
  
    return new TransactionInstruction({
      programId: programId,
      keys: [
        {
          pubkey: nftHolder,
          isWritable: false,
          isSigner: true,
        },
        {
          pubkey: nftTokenAccount,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: stakeAccount,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: SystemProgram.programId,
          isWritable: false,
          isSigner: false,
        },
      ],
      data: Buffer.from([0]),
    })
  }
  
  // 6. need to add all the new accounts here 
  export function createStakingInstruction(
    nftHolder: PublicKey,
    nftTokenAccount: PublicKey,
    // 6. 
    nftMint: PublicKey,
    nftEdition: PublicKey,
    tokenProgram: PublicKey,
    metadataProgram: PublicKey,
    programId: PublicKey
  ): TransactionInstruction {
    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
      programId
    )
  
    // 7.
    const [delegateAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      programId
    )
  
    return new TransactionInstruction({
      programId: programId,
      keys: [
        {
          pubkey: nftHolder,
          isWritable: false,
          isSigner: true,
        },
        {
          pubkey: nftTokenAccount,
          isWritable: true,
          isSigner: false,
        },
        // 8. mint
        {
          pubkey: nftMint,
          isWritable: false,
          isSigner: false,
        },
        // 9. edition
        {
          pubkey: nftEdition,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: stakeAccount,
          isWritable: true,
          isSigner: false,
        },
        // 10. program authority -- writable
        {
          pubkey: delegateAuthority,
          isWritable: true,
          isSigner: false,
        },
        // 11. token program 
        {
          pubkey: tokenProgram,
          isWritable: false,
          isSigner: false,
        },
        // 12. metadata program 
        {
          pubkey: metadataProgram,
          isWritable: false,
          isSigner: false,
        },
      ],
      data: Buffer.from([1]),
    })
  }
  
  
  export function createRedeemInstruction(
    nftHolder: PublicKey,
    nftTokenAccount: PublicKey,
    // 17. 
    mint: PublicKey,
    userStakeATA: PublicKey,
    tokenProgram: PublicKey,
    programId: PublicKey
  ): TransactionInstruction {
    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
      programId
    )
  
    // 18. derive 
    const [mintAuth] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      programId
    )
  
  
  
    return new TransactionInstruction({
      programId: programId,
      keys: [
        {
          pubkey: nftHolder,
          isWritable: false,
          isSigner: true,
        },
        {
          pubkey: nftTokenAccount,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: stakeAccount,
          isWritable: true,
          isSigner: false,
        },
        // 19.
        {
          pubkey: mint,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: mintAuth,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: userStakeATA,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: tokenProgram,
          isWritable: false,
          isSigner: false,
        },
      ],
      data: Buffer.from([2]),
    })
  }
  
  export function createUnstakeInstruction(
    nftHolder: PublicKey,
    nftTokenAccount: PublicKey,
    // 28.
    nftMint: PublicKey,
    nftEdition: PublicKey,
    stakeMint: PublicKey,
    userStakeATA: PublicKey,
    tokenProgram: PublicKey,
    metadataProgram: PublicKey,
    programId: PublicKey
  ): TransactionInstruction {
    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [nftHolder.toBuffer(), nftTokenAccount.toBuffer()],
      programId
    )
  
    // 28. 
    const [delegateAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      programId
    )
  
    // 28. 
    const [mintAuth] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      programId
    )
  
    return new TransactionInstruction({
      programId: programId,
      keys: [
        // 28. need to match from processor to client side here 
        {
          pubkey: nftHolder,
          isWritable: false,
          isSigner: true,
        },
        {
          pubkey: nftTokenAccount,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: nftMint,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: nftEdition,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: stakeAccount,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: delegateAuthority,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: stakeMint,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: mintAuth,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: userStakeATA,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: tokenProgram,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: metadataProgram,
          isWritable: false,
          isSigner: false,
        },
  
  
      ],
      data: Buffer.from([3]),
    })
  }