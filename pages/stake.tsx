// James' code from https://github.com/jamesrp13/buildspace-buildoors/blob/solution-lootboxes/pages/stake.tsx


import {
  Heading,
  VStack,
  Text,
  HStack,
  Flex,
  Image,
  Center,
  SimpleGrid,
} from "@chakra-ui/react"
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { NextPage } from "next"
import { useCallback, useEffect, useState } from "react"
import MainLayout from "../components/MainLayout"
import { StakeOptionsDisplay } from "../components/StakeOptionsDisplay"
import { useWorkspace } from "../components/WorkspaceProvider"
import { getStakeAccount, StakeAccount } from "../utils/accounts"
import { GEAR_OPTIONS } from "../utils/constants"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import { Lootbox } from "../components/Lootbox"
import { GearItem } from "../components/GearItem"

const Stake: NextPage<StakeProps> = ({ mintAddress, imageSrc }) => {
  const [stakeAccount, setStakeAccount] = useState<StakeAccount>()
  const [nftTokenAccount, setNftTokenAccount] = useState<PublicKey>()
  const [nftData, setNftData] = useState<any>()
  const [gearBalances, setGearBalances] = useState<any>({})

  const { connection } = useConnection()
  const walletAdapter = useWallet()

  useEffect(() => {
    const metaplex = Metaplex.make(connection).use(
      walletAdapterIdentity(walletAdapter)
    )

    const mint = new PublicKey(mintAddress)

    try {
      metaplex
        .nfts()
        .findByMint({ mintAddress: mint })
        .run()
        .then((nft) => {
          setNftData(nft)
          fetchstate(nft.mint.address)
        })
    } catch (error) {
      console.log("error getting nft:", error)
    }
  }, [connection, walletAdapter])

  const { stakingProgram } = useWorkspace()
  const fetchstate = useCallback(
    async (mint: PublicKey) => {
      try {
        if (!walletAdapter.publicKey) {
          return
        }

        const tokenAccount = (await connection.getTokenLargestAccounts(mint))
          .value[0].address

        setNftTokenAccount(tokenAccount)

        const account = await getStakeAccount(
          stakingProgram,
          walletAdapter.publicKey,
          tokenAccount
        )

        setStakeAccount(account)

        let balances: any = {}
        for (let i = 0; i < GEAR_OPTIONS.length; i++) {
          const gearMint = GEAR_OPTIONS[i]
          const ata = await getAssociatedTokenAddress(
            gearMint,
            walletAdapter.publicKey
          )
          try {
            const account = await getAccount(connection, ata)
            balances[gearMint.toBase58()] = Number(account.amount)
          } catch {}
        }

        setGearBalances(balances)
      } catch (e) {
        console.log("error getting stake account:", e)
      }
    },
    [connection, walletAdapter, stakingProgram]
  )

  return (
    <MainLayout>
      <VStack spacing={7} justify="flex-start" align="flex-start">
        <Heading color="white" as="h1" size="2xl">
          Level up your buildoor
        </Heading>
        <Text color="bodyText" fontSize="xl" textAlign="start" maxWidth="600px">
          Stake your buildoor to earn 10 $BLD per day to get access to a
          randomized loot box full of upgrades for your buildoor
        </Text>
        <HStack spacing={20} alignItems="flex-start">
          <VStack align="flex-start" minWidth="200px">
            <Flex direction="column">
              <Image src={imageSrc ?? ""} alt="buildoor nft" zIndex="1" />
              <Center
                bgColor="secondaryPurple"
                borderRadius="0 0 8px 8px"
                marginTop="-8px"
                zIndex="2"
                height="32px"
              >
                <Text
                  color="white"
                  as="b"
                  fontSize="md"
                  width="100%"
                  textAlign="center"
                >
                  {stakeAccount?.stakeState.staked ? "STAKING" : "UNSTAKED"}
                </Text>
              </Center>
            </Flex>
            <Text fontSize="2xl" as="b" color="white">
              LEVEL {1}
            </Text>
          </VStack>
          <VStack alignItems="flex-start" spacing={10}>
            <StakeOptionsDisplay
              nftData={nftData}
              stakeAccount={stakeAccount}
              fetchState={fetchstate}
            />
            <HStack spacing={10} align="start">
              {Object.keys(gearBalances).length > 0 && (
                <VStack alignItems="flex-start">
                  <Text color="white" as="b" fontSize="2xl">
                    Gear
                  </Text>
                  <SimpleGrid
                    columns={Math.min(2, Object.keys(gearBalances).length)}
                    spacing={3}
                  >
                    {Object.keys(gearBalances).map((key, _) => {
                      return (
                        <GearItem
                          item={key}
                          balance={gearBalances[key]}
                          key={key}
                        />
                      )
                    })}
                  </SimpleGrid>
                </VStack>
              )}
              <VStack alignItems="flex-start">
                <Text color="white" as="b" fontSize="2xl">
                  Loot Box
                </Text>
                <HStack>
                  {nftData && nftTokenAccount && (
                    <Lootbox
                      stakeAccount={stakeAccount}
                      nftTokenAccount={nftTokenAccount}
                      fetchUpstreamState={() => {
                        fetchstate(nftData.mint.address)
                      }}
                    />
                  )}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </HStack>
      </VStack>
    </MainLayout>
  )
}

interface StakeProps {
  mintAddress: string
  imageSrc: string
}

Stake.getInitialProps = async ({ query }: any) => {
  const { mint, imageSrc } = query

  if (!mint || !imageSrc) throw { error: "no mint" }

  try {
    const _ = new PublicKey(mint)

    return { mintAddress: mint, imageSrc: imageSrc }
  } catch {
    throw { error: "invalid mint" }
  }
}

export default Stake

// V2 of CODE

// import { NextPage } from "next";
// import { PublicKey } from "@solana/web3.js";
// import MainLayout from "../components/MainLayout";
// import {
//   Heading,
//   VStack,
//   Text,
//   HStack,
//   Flex,
//   Image,
//   Center,
// } from "@chakra-ui/react";
// import { useEffect, useState } from "react";
// import { StakeOptionsDisplay } from "../components/StakeOptionsDisplay";
// import { ItemBox } from "../components/ItemBox";
// import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";

// // 103.
// const Stake: NextPage<StakeProps> = ({ mint, imageSrc }) => {
//   const [isStaking, setIsStaking] = useState(false);
//   const [level, setLevel] = useState(1);
//   // 221.
//   const [nftData, setNftData] = useState<any>();

//   // 223.
//   const { connection } = useConnection();

//   // 224.
//   const walletAdapter = useWallet();

//   // 222.
//   useEffect(() => {
//     const metaplex = Metaplex.make(connection).use(
//       walletAdapterIdentity(walletAdapter)
//     );

//     try {
//       metaplex
//         .nfts()
//         .findByMint({ mintAddress: mint })
//         .run()
//         .then((nft) => {
//           console.log("nft data on stake page: ", nft);
//           setNftData(nft);
//         });
//     } catch (e) {
//       console.log("error getting nft: ", e);
//     }
//   }, [walletAdapter, connection, nftData]);
//   // 108.
//   return (
//     <MainLayout>
//       <VStack spacing={7} justify="flex-start" align="flex-start">
//         <Heading color="white" as="h1" size="2xl">
//           Level Up Your DoorBuil
//         </Heading>
//         <Text color="bodyText" fontSize="xl" textAlign="start" maxWidth="600px">
//           Stake your buildoor to eart 10 $GRC per day to get access to a
//           randomized loot box full of upgrades for your buildoor.
//         </Text>
//         <HStack spacing={20} alignItems="flex-start">
//           <VStack align="flex-start" minWidth="200px">
//             <Flex direction="column">
//               <Image src={imageSrc ?? ""} alt="buildoor nft" zIndex="1" />
//               <Center
//                 bgColor="secondaryPurple"
//                 borderRadius="0 0 8px 8px"
//                 marginTop="-8px"
//                 zIndex="2"
//                 height="32px"
//               >
//                 <Text
//                   color="white"
//                   as="b"
//                   fontSize="md"
//                   width="100%"
//                   textAlign="center"
//                 >
//                   {isStaking ? "STAKING" : "UNSTAKED"}
//                 </Text>
//               </Center>
//             </Flex>
//             <Text fontSize="2xl" as="b" color="white">
//               LEVEL {level}
//             </Text>
//           </VStack>
//           <VStack alignItems="flex-start" spacing={10}>
//             {/* 111. */}
//             <StakeOptionsDisplay
//               // 220.
//               nftData={nftData}
//               // 219.
//               isStaked={false}
//               daysStaked={4}
//               totalEarned={60}
//               claimable={100}
//             ></StakeOptionsDisplay>

//             <HStack spacing={10}>
//               <VStack alignItems="flex-start">
//                 <Text color="white" as="b" fontSize="2xl">
//                   Gear
//                 </Text>
//                 <HStack>
//                   <ItemBox>MOCK</ItemBox>
//                   <ItemBox>MOCK TWO</ItemBox>
//                 </HStack>
//               </VStack>

//               <VStack alignItems="flex-start">
//                 <Text color="white" as="b" fontSize="2xl">
//                   Loot Boxes
//                 </Text>
//                 <HStack>
//                   <ItemBox>MOCK</ItemBox>
//                   <ItemBox>MOCK TWO</ItemBox>
//                 </HStack>
//               </VStack>
//             </HStack>
//           </VStack>
//         </HStack>
//       </VStack>
//     </MainLayout>
//   );
// };

// // 104.
// interface StakeProps {
//   mint: PublicKey;
//   imageSrc: string;
// }

// // 109.
// Stake.getInitialProps = async ({ query }: any) => {
//   const { mint, imageSrc } = query;

//   if (!mint || !imageSrc) throw { error: "no mint" };

//   try {
//     const mintPubkey = new PublicKey(mint);
//     return { mint: mintPubkey, imageSrc: imageSrc };
//   } catch {
//     throw { error: "invalid mint" };
//   }
// };

// export default Stake;



// MY ORIGINAL CODE
// import {
//   Heading,
//   VStack,
//   Text,
//   HStack,
//   Flex,
//   Image,
//   Center,
// } from "@chakra-ui/react"
// import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"
// import { useConnection, useWallet } from "@solana/wallet-adapter-react"
// import { PublicKey } from "@solana/web3.js"
// import { NextPage } from "next"
// import { useEffect, useState } from "react"
// import { ItemBox } from "../components/ItemBox"
// import MainLayout from "../components/MainLayout"
// import { StakeOptionsDisplay } from "../components/StakeOptionsDisplay"

// const Stake: NextPage<StakeProps> = ({ mint, imageSrc }) => {
//   const [isStaking, setIsStaking] = useState(false)
//   const [level, setLevel] = useState(1)
//   const [nftData, setNftData] = useState<any>()

//   const { connection } = useConnection()
//   const walletAdapter = useWallet()

//   useEffect(() => {
//     const metaplex = Metaplex.make(connection).use(
//       walletAdapterIdentity(walletAdapter)
//     )

//     try {
//       metaplex
//         .nfts()
//         .findByMint({ mintAddress: mint })
//         .run()
//         .then((nft) => {
//           console.log("nft data on stake page:", nft)
//           setNftData(nft)
//         })
//     } catch (e) {
//       console.log("error getting nft:", e)
//     }
//   }, [connection, walletAdapter])

//   return (
//     <MainLayout>
//       <VStack spacing={7} justify="flex-start" align="flex-start">
//         <Heading color="white" as="h1" size="2xl">
//           Level up your buildoor
//         </Heading>
//         <Text color="bodyText" fontSize="xl" textAlign="start" maxWidth="600px">
//           Stake your buildoor to earn 10 $BLD per day to get access to a
//           randomized loot box full of upgrades for your buildoor
//         </Text>
//         <HStack spacing={20} alignItems="flex-start">
//           <VStack align="flex-start" minWidth="200px">
//             <Flex direction="column">
//               <Image src={imageSrc ?? ""} alt="buildoor nft" zIndex="1" />
//               <Center
//                 bgColor="secondaryPurple"
//                 borderRadius="0 0 8px 8px"
//                 marginTop="-8px"
//                 zIndex="2"
//                 height="32px"
//               >
//                 <Text
//                   color="white"
//                   as="b"
//                   fontSize="md"
//                   width="100%"
//                   textAlign="center"
//                 >
//                   {isStaking ? "STAKING" : "UNSTAKED"}
//                 </Text>
//               </Center>
//             </Flex>
//             <Text fontSize="2xl" as="b" color="white">
//               LEVEL {level}
//             </Text>
//           </VStack>
//           <VStack alignItems="flex-start" spacing={10}>
//             <StakeOptionsDisplay
//               nftData={nftData}
//               isStaked={false}
//               daysStaked={4}
//               totalEarned={60}
//               claimable={20}
//             />
//             <HStack spacing={10}>
//               <VStack alignItems="flex-start">
//                 <Text color="white" as="b" fontSize="2xl">
//                   Gear
//                 </Text>
//                 <HStack>
//                   <ItemBox>mock</ItemBox>
//                   <ItemBox>mock</ItemBox>
//                 </HStack>
//               </VStack>
//               <VStack alignItems="flex-start">
//                 <Text color="white" as="b" fontSize="2xl">
//                   Loot Boxes
//                 </Text>
//                 <HStack>
//                   <ItemBox>mock</ItemBox>
//                   <ItemBox>mock</ItemBox>
//                   <ItemBox>mock</ItemBox>
//                 </HStack>
//               </VStack>
//             </HStack>
//           </VStack>
//         </HStack>
//       </VStack>
//     </MainLayout>
//   )
// }

// interface StakeProps {
//   mint: PublicKey
//   imageSrc: string
// }

// Stake.getInitialProps = async ({ query }: any) => {
//   const { mint, imageSrc } = query

//   if (!mint || !imageSrc) throw { error: "no mint" }

//   try {
//     const mintPubkey = new PublicKey(mint)
//     return { mint: mintPubkey, imageSrc: imageSrc }
//   } catch {
//     throw { error: "invalid mint" }
//   }
// }

// export default Stake
