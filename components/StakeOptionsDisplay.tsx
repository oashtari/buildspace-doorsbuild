import { VStack, Text, Button } from "@chakra-ui/react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getAssociatedTokenAddress,
  getAccount,
  Account,
} from "@solana/spl-token"
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
import { STAKE_MINT } from "../utils/constants"
import { StakeAccount } from "../utils/accounts"
import { useWorkspace } from "./WorkspaceProvider"

export const StakeOptionsDisplay = ({
  nftData,
  stakeAccount,
  fetchState,
}: {
  nftData: any
  stakeAccount?: StakeAccount
  fetchState: (_: PublicKey) => void
}) => {
  const walletAdapter = useWallet()
  const { connection } = useConnection()

  const [isConfirmingTransaction, setIsConfirmingTransaction] = useState(false)
  const [nftTokenAccount, setNftTokenAccount] = useState<PublicKey>()
  const [bldTokenAccount, setBldTokenAccount] = useState<Account>()
  const workspace = useWorkspace()

  useEffect(() => {
    if (nftData) {
      connection
        .getTokenLargestAccounts(nftData.mint.address)
        .then((accounts) => setNftTokenAccount(accounts.value[0].address))
    }

    if (walletAdapter.publicKey) {
      getTokenAccount(walletAdapter.publicKey, connection)
    }
  }, [nftData, walletAdapter, connection])

  const getTokenAccount = async (
    publicKey: PublicKey,
    connection: Connection
  ) => {
    try {
      const ata = await getAssociatedTokenAddress(STAKE_MINT, publicKey)
      const account = await getAccount(connection, ata)
      setBldTokenAccount(account)
    } catch (error) {
      console.log(error)
    }
  }

  const handleStake = useCallback(async () => {
    if (
      !walletAdapter.connected ||
      !walletAdapter.publicKey ||
      !nftTokenAccount ||
      !workspace.stakingProgram
    ) {
      alert("Please connect your wallet")
      return
    }

    const transaction = new Transaction()

    transaction.add(
      await workspace.stakingProgram.methods
        .stake()
        .accounts({
          nftTokenAccount: nftTokenAccount,
          nftMint: nftData.mint.address,
          nftEdition: nftData.edition.address,
          metadataProgram: METADATA_PROGRAM_ID,
        })
        .instruction()
    )

    await sendAndConfirmTransaction(transaction)
  }, [walletAdapter, connection, nftData, nftTokenAccount])

  const sendAndConfirmTransaction = useCallback(
    async (transaction: Transaction) => {
      setIsConfirmingTransaction(true)

      try {
        const signature = await walletAdapter.sendTransaction(
          transaction,
          connection
        )

        const latestBlockhash = await connection.getLatestBlockhash()
        await connection.confirmTransaction(
          {
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: signature,
          },
          "finalized"
        )

        await getTokenAccount(walletAdapter.publicKey!, connection)
        if (nftData) {
          await fetchState(nftData.mint.address)
        }
      } catch (error) {
        console.log(error)
      } finally {
        setIsConfirmingTransaction(false)
      }
    },
    [walletAdapter, connection, nftData]
  )

  const handleUnstake = useCallback(async () => {
    if (
      !walletAdapter.connected ||
      !walletAdapter.publicKey ||
      !nftTokenAccount ||
      !workspace.stakingProgram
    ) {
      alert("Please connect your wallet")
      return
    }

    const userStakeATA = await getAssociatedTokenAddress(
      STAKE_MINT,
      walletAdapter.publicKey
    )

    const transaction = new Transaction()

    transaction.add(
      await workspace.stakingProgram.methods
        .unstake()
        .accounts({
          nftTokenAccount: nftTokenAccount,
          nftMint: nftData.mint.address,
          nftEdition: nftData.edition.address,
          metadataProgram: METADATA_PROGRAM_ID,
          stakeMint: STAKE_MINT,
          userStakeAta: userStakeATA,
        })
        .instruction()
    )

    await sendAndConfirmTransaction(transaction)
  }, [walletAdapter, connection, nftData, nftTokenAccount, workspace])

  const handleClaim = useCallback(async () => {
    if (
      !walletAdapter.connected ||
      !walletAdapter.publicKey ||
      !nftTokenAccount ||
      !workspace.stakingProgram
    ) {
      alert("Please connect your wallet")
      return
    }

    const userStakeATA = await getAssociatedTokenAddress(
      STAKE_MINT,
      walletAdapter.publicKey
    )

    const transaction = new Transaction()

    transaction.add(
      await workspace.stakingProgram.methods
        .redeem()
        .accounts({
          nftTokenAccount: nftTokenAccount,
          stakeMint: STAKE_MINT,
          userStakeAta: userStakeATA,
        })
        .instruction()
    )

    await sendAndConfirmTransaction(transaction)
  }, [walletAdapter, connection, nftData, nftTokenAccount])

  const daysStaked = useMemo(() => {
    return stakeAccount?.daysStaked() ?? 0
  }, [stakeAccount])

  return (
    <VStack
      bgColor="containerBg"
      borderRadius="20px"
      padding="20px 40px"
      spacing={5}
    >
      <Text
        bgColor="containerBgSecondary"
        padding="4px 8px"
        borderRadius="20px"
        color="bodyText"
        as="b"
        fontSize="sm"
      >
        {stakeAccount?.stakeState.staked
          ? daysStaked < 1
            ? "STAKED LESS THAN 1 DAY"
            : `STAKED ${daysStaked} DAY${
                Math.floor(daysStaked) === 1 ? "" : "S"
              }`
          : "READY TO STAKE"}
      </Text>
      <VStack spacing={-1}>
        <Text color="white" as="b" fontSize="4xl">
          {`${Number(bldTokenAccount?.amount ?? 0) / Math.pow(10, 2)} $BLD`}
        </Text>
        <Text color="bodyText">
          {stakeAccount?.stakeState.staked
            ? `${stakeAccount?.claimable().toPrecision(2)} $BLD earned`
            : "earn $BLD by staking"}
        </Text>
      </VStack>
      <Button
        onClick={stakeAccount?.stakeState.staked ? handleClaim : handleStake}
        bgColor="buttonGreen"
        width="200px"
        isLoading={isConfirmingTransaction}
      >
        <Text as="b">
          {stakeAccount?.stakeState.staked ? "claim $BLD" : "stake buildoor"}
        </Text>
      </Button>
      {stakeAccount?.stakeState.staked ? (
        <Button onClick={handleUnstake} isLoading={isConfirmingTransaction}>
          unstake
        </Button>
      ) : null}
    </VStack>
  )
}


// // MY CODE, REPLACING WITH JAMES ABOVE, TOO MANY CHANGES
// import {
//   VStack,
//   Text,
//   Button,
//   useColorMode,
//   useStatStyles,
//   useDrawerContext,
// } from "@chakra-ui/react";
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// import { useCallback, useEffect, useState } from "react";
// import {
//   createInitializeStakeAccountInstruction,
//   createRedeemInstruction,
//   createStakingInstruction,
//   createUnstakeInstruction,
// } from "../utils/instructions";
// // 206.
// import {
//   createAssociatedTokenAccount,
//   createAssociatedTokenAccountInstruction,
//   getAssociatedTokenAddress,
//   TOKEN_PROGRAM_ID,
// } from "@solana/spl-token";
// import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
// import { PROGRAM_ID, STAKE_MINT } from "../utils/constants";
// import { PublicKey, Transaction } from "@solana/web3.js";
// import { getStakeAccount } from "../utils/accounts";
// // 207. grab the program id from the last deploy of the nft staking program
// // 208.  grab the mint address from tokens/bld/cache.json and put in .env.local
// // 307. 
// import * as anchor from "@project-serum/anchor"
// import { useWorkspace } from "./WorkspaceProvider";

// // 110.
// export const StakeOptionsDisplay = ({
//   // 205.
//   nftData,
//   isStaked,
//   daysStaked,
//   totalEarned,
//   claimable,
// }: {
//   // 205.
//   nftData: any;
//   isStaked: boolean;
//   daysStaked: number;
//   totalEarned: number;
//   claimable: number;
// }) => {
//   // 203.
//   const walletAdapter = useWallet();
//   const { connection } = useConnection();
//   //starting with default value that is passed into function
//   const [isStaking, setIsStaking] = useState(isStaked);
//   const [nftTokenAccount, setNftTokenAccount] = useState<PublicKey>();

//   // 308. 
//   const workspace = useWorkspace();

//   // // 210.
//   // const checkStakingStatus = useCallback(async () => {
//   //   // in here we can check whether we're still staking or not
//   //   // 309. add a check for workspace 
//   //   if (!walletAdapter.publicKey || !nftTokenAccount || !workspace.program) {
//   //     return;
//   //   }

//   //   // 310. actually moved over to account.ts in utils
//   //   // const [pda] = PublicKey.findProgramAddressSync(
//   //   //   [walletAdapter.publicKey.toBuffer(), nftTokenAccount.toBuffer()], 
//   //   //   workspace.program.programId
//   //   //   )
//   //   // const account = workspace.program.account.userStakeInfo.fetch(pda);

//   //   // 212.
//   //   try {
//   //     const account = await getStakeAccount(
//   //       // connection, ONLY CHANGE HERE in addition to check above
//   //       workspace.program,
//   //       walletAdapter.publicKey,
//   //       nftTokenAccount as PublicKey
//   //     );

//   //     console.log("stake account: ", account);

//   //     setIsStaking(account.state === 0);
//   //   } catch (e) {
//   //     console.log("error: ", e);
//   //   }
//   // }, [walletAdapter, connection, nftTokenAccount]);

//   useEffect(() => {
//     // checkStakingStatus();

//     if (nftData) {
//       connection
//         .getTokenLargestAccounts(nftData.mint.address)
//         .then((accounts) => setNftTokenAccount(accounts.value[0].address));
//     }
//   }, [nftData, walletAdapter, connection]);

//   const handleStake = useCallback(async () => {
//     // 204.
//     if (
//       !walletAdapter.connected ||
//       !walletAdapter.publicKey ||
//       !nftTokenAccount ||
//       !workspace.stakingProgram
//     ) {
//       alert("please connect your wallet");
//       return;
//     }
    
//     // 313. first add check for workspace program, then call stake.accounts, this is similar to what we wrote in our tests for anchor nft staking repo
//     const transaction = new Transaction();

//     transaction.add(
//       await workspace.stakingProgram.methods.stake().accounts({
//         nftTokenAccount: nftTokenAccount,
//         nftMint: nftData.mint.address,
//         nftEdition: nftData.edition.address,
//         metadataProgram: METADATA_PROGRAM_ID,
//       }).instruction()
//     )

//     // uncertain about what happened to this code
//     const [stakeAccount] = PublicKey.findProgramAddressSync(
//       [walletAdapter.publicKey.toBuffer(), nftTokenAccount.toBuffer()],
//       PROGRAM_ID
//     );
    
//     // this is now handled by init-if-needed in stake() , also pre anchor code
//     // const account = await connection.getAccountInfo(stakeAccount);

//     // if (!account) 
//       // transaction.add(
//       //   createInitializeStakeAccountInstruction(
//       //     walletAdapter.publicKey,
//       //     nftTokenAccount,
//       //     PROGRAM_ID
//       //   )
//       // );
      
//       //pre anchor code
//       // const stakeInstruction = createStakingInstruction(
//         //   walletAdapter.publicKey, // token account address
//         //   nftTokenAccount,
//         //   nftData.mint.address,
//         //   nftData.edition.address,
//         //   // 206. need to import these
//         //   TOKEN_PROGRAM_ID,
//         //   METADATA_PROGRAM_ID,
//         //   // 209. add constants.ts under utils, and import here
//         //   PROGRAM_ID
//         // );
//         // 210.
        
        
//         await sendAndConfirmTransaction(transaction);
//       }, [walletAdapter, connection, nftData, nftTokenAccount]);
    

//   // 213. creating helper function as we will do these steps many times
//   const sendAndConfirmTransaction = useCallback(
//     async (transaction: Transaction) => {
//       try {
//         const signature = await walletAdapter.sendTransaction(
//           transaction,
//           connection
//         );

//         const latestBlockhash = await connection.getLatestBlockhash();

//         await connection.confirmTransaction(
//           {
//             blockhash: latestBlockhash.blockhash,
//             lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
//             signature: signature,
//           },
//           "finalized"
//         );
//       } catch (e) {
//         console.log("error: ", e);
//       }
//       // await checkStakingStatus();
//     },
//     [walletAdapter, connection]
//   );

//   // 214.
//   const handleClaim = useCallback(async () => {
//     // 215.
//     if (
//       !walletAdapter.connected ||
//       !walletAdapter.publicKey ||
//       !nftTokenAccount ||
//       !workspace.stakingProgram
//     ) {
//       alert("please connect your wallet");
//       return;
//     }

//     // 216. check to see if associated token account exists
//     const userStakeATA = await getAssociatedTokenAddress(
//       // 217. create const for key
//       STAKE_MINT,
//       walletAdapter.publicKey
//     );

//     // related to not needing to check below
//     // const account = await connection.getAccountInfo(userStakeATA);

//     const transaction = new Transaction();

//     // post anchor, don't need to check if it exists or not
//     // if (!account) {
//     //   transaction.add(
//     //     createAssociatedTokenAccountInstruction(
//     //       walletAdapter.publicKey,
//     //       userStakeATA,
//     //       walletAdapter.publicKey,
//     //       STAKE_MINT
//     //     )
//     //   );
//     // }

//     transaction.add(
//       await workspace.stakingProgram.methods.redeem().accounts({
//         nftTokenAccount: nftTokenAccount,
//         stakeMint: STAKE_MINT,
//         userStakeAta: userStakeATA
//       }).instruction()

//       // PRE ANCHOR CODE
//       // createRedeemInstruction(
//       //   walletAdapter.publicKey,
//       //   nftTokenAccount as PublicKey,
//       //   nftData.mint.address,
//       //   userStakeATA,
//       //   TOKEN_PROGRAM_ID,
//       //   PROGRAM_ID
//       // )
//     );

//     await sendAndConfirmTransaction(transaction);
//   }, [walletAdapter, connection]);

//   const handleUnstake = useCallback(async () => {
//     // 218. copied from above
//     if (
//       !walletAdapter.connected ||
//       !walletAdapter.publicKey ||
//       !nftTokenAccount ||
//       !workspace.stakingProgram
//     ) {
//       alert("please connect your wallet");
//       return;
//     }

//     const transaction = new Transaction();

//     const userStakeATA = await getAssociatedTokenAddress(
//         STAKE_MINT,
//         walletAdapter.publicKey
//       );
      
//     // PRE ANCHOR CODE
//     // const account = await connection.getAccountInfo(userStakeATA);


//     // if (!account) {
//     //   transaction.add(
//     //     createAssociatedTokenAccountInstruction(
//     //       walletAdapter.publicKey,
//     //       userStakeATA,
//     //       walletAdapter.publicKey,
//     //       STAKE_MINT
//     //     )
//     //   );
//     // }

//     // 314. 
//     transaction.add(
//       await workspace.stakingProgram.methods.unstake().accounts({
//         nftTokenAccount: nftTokenAccount,
//         nftMint: nftData.mint.address,
//         nftEdition: nftData.edition.address,
//         metadataProgram: METADATA_PROGRAM_ID,
//         stakeMint: STAKE_MINT,
//         userStakeAta: userStakeATA,
//       }).instruction()

//       // createUnstakeInstruction(
//       //   walletAdapter.publicKey,
//       //   nftTokenAccount,
//       //   nftData.mind.address,
//       //   nftData.edition.address,
//       //   STAKE_MINT,
//       //   userStakeATA,
//       //   TOKEN_PROGRAM_ID,
//       //   METADATA_PROGRAM_ID,
//       //   PROGRAM_ID
//       // )
//     );

//     await sendAndConfirmTransaction(transaction);
//   }, [walletAdapter, connection]);

//   return (
//     <VStack
//       bgColor="containgerBg"
//       borderRadius="20px"
//       padding="20px 40px"
//       spacing={5}
//     >
//       <Text
//         bgColor="containerBgSecondary"
//         padding="4px 8px"
//         borderRadius="20px"
//         color="bodyText"
//         as="b"
//         fontSize="sm"
//       >
//         {isStaking
//           ? `STAKING${daysStaked} DAY${daysStaked === 1 ? "" : "S"}`
//           : "READY TO STAKE"}
//       </Text>
//       <VStack spacing="-1">
//         <Text color="white" as="b" fontSize="4xl">
//           {isStaking ? `${totalEarned} $GRC` : "0 $GRC"}
//         </Text>
//         <Text color="bodyText">
//           {isStaking ? `${claimable} $GRC earned` : "earn $GRC by staking"}
//         </Text>
//       </VStack>
//       <Button
//         onClick={isStaking ? handleClaim : handleStake}
//         bgColor="buttonGreen"
//         width="200px"
//       >
//         <Text as="b">{isStaking ? "claim $GRC" : "stake doorbuil"}</Text>
//       </Button>
//       {isStaking ? <Button onClick={handleUnstake}>Unstake</Button> : null}
//     </VStack>
//   );
// };
