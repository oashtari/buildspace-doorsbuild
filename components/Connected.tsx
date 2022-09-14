// 30. copy from disconnected and paste 

import {FC} from 'react'
import {Container, VStack, Heading, Button, Text, HStack, Image} from "@chakra-ui/react"



const Connected:FC = () => {


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

            <Button bgColor="accent" color="white" maxW="380px" >
                <Text>mint buildoor</Text>
            </Button>
            
        </VStack>
    )
} 

export default Connected