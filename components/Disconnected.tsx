import {FC, MouseEventHandler, useCallback} from 'react'
import {Container, VStack, Heading, Button, Text, HStack} from "@chakra-ui/react"
import { ArrowForwardIcon } from '@chakra-ui/icons'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'


const Disconnected:FC = () => {

    // 29. add below two, make sure imports occurred

    const modalState = useWalletModal()
    const {wallet, connect} = useWallet()

    // 19. create handleClick handler 
    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (event) => {
            if (event.defaultPrevented) return

            if(!wallet) {
                modalState.setVisible(true)
            } else {
                connect().catch(() => {})
            }
        }, 
        [wallet, connect, modalState] // have to add this array of dependencies
    )

    return(
        // 15. make a conatiner from chakra, it wraps text into the middle so it doesn't go on forever
        <Container>
            <VStack spacing={20}>
            <Heading color="white" as="h1" size="3xl" noOfLines={2} textAlign="center">
                Mint your Buildooor 
                Earn $BLD.
                Level UP!!
            </Heading>
            {/* 18. add button */}
            <Button bgColor="accent" color="white" maxW="380px" onClick={handleClick}>
                <HStack>
                    <Text>Become a buildoor</Text>
                    <ArrowForwardIcon></ArrowForwardIcon>
                </HStack>
            </Button>
            </VStack>
        </Container>
    )
} 

export default Disconnected