import {
  VStack,
  Text,
  Button,
  useColorMode,
  useStatStyles,
} from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import {
  createInitializeStakeAccountInstruction,
  createRedeemInstruction,
  createStakingInstruction,
  createUnstakeInstruction,
} from "../utils/instructions";
// 206.
import {
  createAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { PROGRAM_ID, STAKE_MINT } from "../utils/constants";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getStakeAccount } from "../utils/accounts";
// 207. grab the program id from the last deploy of the nft staking program
// 208.  grab the mint address from tokens/bld/cache.json and put in .env.local

// 110.
export const StakeOptionsDisplay = ({
  // 205.
  nftData,
  isStaked,
  daysStaked,
  totalEarned,
  claimable,
}: {
  // 205.
  nftData: any;
  isStaked: boolean;
  daysStaked: number;
  totalEarned: number;
  claimable: number;
}) => {
  // 203.
  const walletAdapter = useWallet();
  const { connection } = useConnection();
  //starting with default value that is passed into function
  const [isStaking, setIsStaking] = useState(isStaked);
  const [nftTokenAccount, setNftTokenAccount] = useState<PublicKey>();

  // 210.
  const checkStakingStatus = useCallback(async () => {
    // in here we can check whether we're still staking or not
    if (!walletAdapter.publicKey) {
      return;
    }
    // 212.
    try {
      const account = await getStakeAccount(
        connection,
        walletAdapter.publicKey,
        nftTokenAccount as PublicKey
      );

      console.log("stake account: ", account);

      setIsStaking(account.state === 0);
    } catch (e) {
      console.log("error: ", e);
    }
  }, [walletAdapter, connection, nftTokenAccount]);

  useEffect(() => {
    checkStakingStatus();

    if (nftData) {
      connection
        .getTokenLargestAccounts(nftData.mint.address)
        .then((accounts) => setNftTokenAccount(accounts.value[0].address));
    }
  }, [nftData, walletAdapter, connection]);

  const handleStake = useCallback(async () => {
    // 204.
    if (
      !walletAdapter.connected ||
      !walletAdapter.publicKey ||
      !nftTokenAccount
    ) {
      alert("please connect your wallet");
      return;
    }

    const [stakeAccount] = PublicKey.findProgramAddressSync(
      [walletAdapter.publicKey.toBuffer(), nftTokenAccount.toBuffer()],
      PROGRAM_ID
    );

    const transaction = new Transaction();

    const account = await connection.getAccountInfo(stakeAccount);

    if (!account) {
      transaction.add(
        createInitializeStakeAccountInstruction(
          walletAdapter.publicKey,
          nftTokenAccount,
          PROGRAM_ID
        )
      );
    }

    const stakeInstruction = createStakingInstruction(
      walletAdapter.publicKey, // token account address
      nftTokenAccount,
      nftData.mint.address,
      nftData.edition.address,
      // 206. need to import these
      TOKEN_PROGRAM_ID,
      METADATA_PROGRAM_ID,
      // 209. add constants.ts under utils, and import here
      PROGRAM_ID
    );
    // 210.
    transaction.add(stakeInstruction);

    sendAndConfirmTransaction(transaction);
  }, [walletAdapter, connection]);

  // 213. creating helper function as we will do these steps many times
  const sendAndConfirmTransaction = useCallback(
    async (transaction: Transaction) => {
      try {
        const signature = await walletAdapter.sendTransaction(
          transaction,
          connection
        );

        const latestBlockhash = await connection.getLatestBlockhash();

        await connection.confirmTransaction(
          {
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: signature,
          },
          "finalized"
        );
      } catch (e) {
        console.log("error: ", e);
      }
      await checkStakingStatus();
    },
    [walletAdapter, connection]
  );

  // 214.
  const handleClaim = useCallback(async () => {
    // 215.
    if (
      !walletAdapter.connected ||
      !walletAdapter.publicKey ||
      !nftTokenAccount
    ) {
      alert("please connect your wallet");
      return;
    }

    // 216. check to see if associated token account exists
    const userStakeATA = await getAssociatedTokenAddress(
      // 217. create const for key
      STAKE_MINT,
      walletAdapter.publicKey
    );

    const account = await connection.getAccountInfo(userStakeATA);

    const transaction = new Transaction();

    if (!account) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletAdapter.publicKey,
          userStakeATA,
          walletAdapter.publicKey,
          STAKE_MINT
        )
      );
    }

    transaction.add(
      createRedeemInstruction(
        walletAdapter.publicKey,
        nftTokenAccount as PublicKey,
        nftData.mint.address,
        userStakeATA,
        TOKEN_PROGRAM_ID,
        PROGRAM_ID
      )
    );

    await sendAndConfirmTransaction(transaction);
  }, [walletAdapter, connection]);

  const handleUnstake = useCallback(async () => {
    // 218. copied from above
    if (
      !walletAdapter.connected ||
      !walletAdapter.publicKey ||
      !nftTokenAccount
    ) {
      alert("please connect your wallet");
      return;
    }

    const userStakeATA = await getAssociatedTokenAddress(
      STAKE_MINT,
      walletAdapter.publicKey
    );

    const account = await connection.getAccountInfo(userStakeATA);

    const transaction = new Transaction();

    if (!account) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletAdapter.publicKey,
          userStakeATA,
          walletAdapter.publicKey,
          STAKE_MINT
        )
      );
    }

    transaction.add(
      createUnstakeInstruction(
        walletAdapter.publicKey,
        nftTokenAccount,
        nftData.mind.address,
        nftData.edition.address,
        STAKE_MINT,
        userStakeATA,
        TOKEN_PROGRAM_ID,
        METADATA_PROGRAM_ID,
        PROGRAM_ID
      )
    );

    await sendAndConfirmTransaction(transaction);
  }, [walletAdapter, connection]);

  return (
    <VStack
      bgColor="containgerBg"
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
        {isStaking
          ? `STAKING${daysStaked} DAY${daysStaked === 1 ? "" : "S"}`
          : "READY TO STAKE"}
      </Text>
      <VStack spacing="-1">
        <Text color="white" as="b" fontSize="4xl">
          {isStaking ? `${totalEarned} $GRC` : "0 $GRC"}
        </Text>
        <Text color="bodyText">
          {isStaking ? `${claimable} $GRC earned` : "earn $GRC by staking"}
        </Text>
      </VStack>
      <Button
        onClick={isStaking ? handleClaim : handleStake}
        bgColor="buttonGreen"
        width="200px"
      >
        <Text as="b">{isStaking ? "claim $GRC" : "stake doorbuil"}</Text>
      </Button>
      {isStaking ? <Button onClick={handleUnstake}>Unstake</Button> : null}
    </VStack>
  );
};
