// 30. copy from disconnected and paste 

import {FC, MouseEventHandler, useCallback, useState, useMemo, useEffect} from 'react'
import {Container, VStack, Heading, Button, Text, HStack, Image} from "@chakra-ui/react"

// 67. need imports to implement handleclick below 
import { PublicKey } from '@solana/web3.js'
import {useConnection, useWallet} from "@solana/wallet-adapter-react"
import { Metaplex, walletAdapterIdentity, CandyMachine} from "@metaplex-foundation/js"

import {useRouter} from 'next/router'


const Connected:FC = () => {

    // 68. adding hooks 
    const {connection} = useConnection()
    const walletAdapter = useWallet()
    const [candyMachine, setCandyMachine] = useState<CandyMachine>()

    // 73. adding usestate for the loading of the object of the landing page 
    const [isMinting, setIsMinting] = useState(false)

    // 69. add metaplex object 
    const metaplex = useMemo(() => {
        return Metaplex.make(connection).use(walletAdapterIdentity(walletAdapter))
    }, [connection, walletAdapter])

    // 70. get candy machine so we can actually mint 
    useEffect(() => {
        if(!metaplex) return

        metaplex
        .candyMachines()
        .findByAddress({
            // 71. address from cache.json
            address: new PublicKey(
                process.env.NEXT_PUBLIC_CANDY_MACHINE_ADDRESS ?? ""
                ),
        })
        .run()
        .then((candyMachine) => {
            console.log("Canndy Machine:", candyMachine)
            setCandyMachine(candyMachine)
        })
        .catch((error=> {
            alert(error)
        }))
    }, [metaplex])

    // 77. create router for routing to new page
    const router = useRouter()

    // 66. add handler for button 
    // 72. implement handle click
    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        async(event) => {
            if (event.defaultPrevented) return

            if(!walletAdapter.connected || !candyMachine) {
                return
            }

            try {
                setIsMinting(true)
                // calling candy machine to mint an nft
                const nft = await metaplex.candyMachines().mint({candyMachine}).run()

                console.log("NFT: ", nft)
                // 78. route to new mint page 
                router.push(`/newMint?mint=${nft.nft.address.toBase58()}`)
            } catch(error) {
                alert(error)
            } finally {
                setIsMinting(false)
            }
        }, 
        // don't forget these or else can't mint
        [metaplex, walletAdapter, candyMachine]
    )

    return(
        // 31. new vstack and other parts 
        <VStack spacing={20}>
            <Container>
                <VStack spacing={8}>
                    <Heading color="white" as='h1' size="2xl" noOfLines={1} textAlign='center'>
                        Welcome buildoor.
                    </Heading>
                    <Text color="bodyText" fontSize="xl" textAlign="center">
                        Each buildoor is randomly generated and can be staked to receive
                        <Text as="b">$BLD</Text>. Use your <Text as="b">$BLD</Text> to upgrade your buildoor and receive perks within the community.
                    </Text>
                </VStack>
            </Container>
            {/* 31. here's where images go, need to import them above  */}
            <HStack spacing={10}>
                <Image src="avatar1.png" alt="" />
                <Image src="avatar2.png" alt="" />
                <Image src="avatar3.png" alt="" />
                <Image src="avatar4.png" alt="" />
                <Image src="avatar5.png" alt="" />
            </HStack>
            {/* 67. add onclick handler to button  */}
            <Button bgColor="accent" color="white" maxW="380px" onClick={handleClick} isLoading={isMinting}>
                <Text>mint buildoor</Text>
            </Button>
            
        </VStack>
    )
} 

export default Connected