// 74. add new page here 
// 75. copy everything from  index . tsx, then make tweaks 


import type { NextPage } from 'next'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import MainLayout from "../components/MainLayout"
import { Container, VStack, Heading, Text, Image, Button, HStack } from '@chakra-ui/react'
import {MouseEventHandler, useCallback, useEffect, useState, useMemo} from 'react'
import { ArrowForwardIcon } from '@chakra-ui/icons'
import { PublicKey } from "@solana/web3.js"
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'




// 80. then change type of NextPage to NewMintProps and pass in mint as argument, that way we can populate the image 

const NewMint: NextPage<NewMintProps> = ({mint}) => {
    // 82. make metaplex object to be able to fetch metadata in useeffect below
    const [metadata, setMetadada] = useState<any>()
    const {connection} = useConnection()
    const walletAdapter = useWallet()

    const metaplex = useMemo(() => {
        return Metaplex.make(connection).use(walletAdapterIdentity(walletAdapter))
    }, [connection, walletAdapter])


    // 81. load metadata from the mint , we will need a metaplex object to implement the useEffect
    useEffect(() => {
        metaplex.nfts().findByMint({mintAddress: new PublicKey(mint)}).run() // this finds the nft object
        .then((nft) => { //capture the returned object inside the .then 
            fetch(nft.uri) // call fetch to do a get request against nft.uri
            .then((res) => res.json()) // convert that response to json
            .then((metadata) => { // we call that json 'metadata' and then set the metadata
                setMetadada(metadata)
            })
        })
    }, [mint, metaplex, walletAdapter])
    

    // 76. add handleClick , ban borrow format from connected component 
    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        async(event) => {},
        []
    )

  return (
    
    <MainLayout>
        <VStack spacing={20}>
            <Container>
                <VStack spacing={8}>
                    <Heading color="white" as="h1" size="2xl" textAlign="center">
                        A new Gracie has appearead!!!
                    </Heading>

                    <Text color="bodyText" fontSize="xl" textAlign="center">
                        Congrats, you minted a level one Gracie. <br/>
                        Time to stake your puppy to earn treats and grow bigger.
                    </Text>
                </VStack>
            </Container>
            {/* 82. after getting metadata above, we can change src below  */}
            {/* the ?? "" simply reverts to an empty string if no image  */}
            <Image src={metadata?.image ?? ""} alt=""/>
            <Button bgColor="accent" color="white" maxW="380px" onClick={handleClick}>
                <HStack>
                    <Text>stake my puppy</Text>
                    <ArrowForwardIcon/>
                </HStack>
            </Button>

        </VStack>

    </MainLayout>
  )
}

// 79. 
interface NewMintProps {
    mint: PublicKey,

}

// 83. 
NewMint.getInitialProps = async({ query }) => {
    const {mint} = query

    if(!mint) throw {error: "no mint"}

   try { 
    const mintPubkey = new PublicKey(mint)
    return { mint: mintPubkey}
    } catch {
        throw {error: "invalid mint"}
    }
}

export default NewMint






// import type { NextPage } from "next"
// import { useConnection, useWallet } from "@solana/wallet-adapter-react"
// import MainLayout from "../components/MainLayout"
// import {
//   Container,
//   Heading,
//   VStack,
//   Text,
//   Image,
//   Button,
//   HStack,
// } from "@chakra-ui/react"
// import {
//   MouseEventHandler,
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
// } from "react"
// import { ArrowForwardIcon } from "@chakra-ui/icons"
// import { PublicKey } from "@solana/web3.js"
// import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"

// const NewMint: NextPage<NewMintProps> = ({ mint }) => {
//   const [metadata, setMetadata] = useState<any>()
//   const { connection } = useConnection()
//   const walletAdapter = useWallet()
//   const metaplex = useMemo(() => {
//     return Metaplex.make(connection).use(walletAdapterIdentity(walletAdapter))
//   }, [connection, walletAdapter])

//   useEffect(() => {
//     metaplex
//       .nfts()
//       .findByMint({ mintAddress: mint })
//       .run()
//       .then((nft) => {
//         fetch(nft.uri)
//           .then((res) => res.json())
//           .then((metadata) => {
//             setMetadata(metadata)
//           })
//       })
//   }, [mint, metaplex, walletAdapter])

//   const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
//     async (event) => {},
//     []
//   )

//   return (
//     <MainLayout>
//       <VStack spacing={20}>
//         <Container>
//           <VStack spacing={8}>
//             <Heading color="white" as="h1" size="2xl" textAlign="center">
//               😮 A new buildoor has appeared!
//             </Heading>

//             <Text color="bodyText" fontSize="xl" textAlign="center">
//               Congratulations, you minted a lvl 1 buildoor! <br />
//               Time to stake your character to earn rewards and level up.
//             </Text>
//           </VStack>
//         </Container>

//         <Image src={metadata?.image ?? ""} alt="" />

//         <Button
//           bgColor="accent"
//           color="white"
//           maxW="380px"
//           onClick={handleClick}
//         >
//           <HStack>
//             <Text>stake my buildoor</Text>
//             <ArrowForwardIcon />
//           </HStack>
//         </Button>
//       </VStack>
//     </MainLayout>
//   )
// }

// interface NewMintProps {
//   mint: PublicKey
// }

// NewMint.getInitialProps = async ({ query }) => {
//   const { mint } = query

//   if (!mint) throw { error: "no mint" }

//   try {
//     const mintPubkey = new PublicKey(mint)
//     return { mint: mintPubkey }
//   } catch {
//     throw { error: "invalid mint" }
//   }
// }

// export default NewMint