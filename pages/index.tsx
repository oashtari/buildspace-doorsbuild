import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

// 5. import chakra ui components
import { Box, Center, Spacer, Stack } from "@chakra-ui/react"

// 13. import Navbar
import NavBar from "../components/Navbar"

// 16. import Disconnected
import Disconnected from '../components/Disconnected'

// 32. import connected 
import Connected from '../components/Connected'
import { useWallet } from '@solana/wallet-adapter-react'

const Home: NextPage = () => {

  // 33. need conditional re connected/disconnected 
  const {connected} = useWallet()

  return (
    <div className={styles.container}>
      {/* 6. create HEAD */}
      <Head>
        <title>Buildoooors</title>
        <meta name="NFT collections for the bldrs"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>

      {/* 7. create Box, represents entirity of UI */}
      < Box 
        w="full" 
        h="calc(100vh)" 
        // bring in image in public folder
        bgImage={connected ? "" : "url(/home-background.svg)"} 
        backgroundPosition="center"
      >
        {/* 8. additions inside box */}
        <Stack w="full" h="calc(100vh)" justify="center">
          {/* 9. inside stack, put all the vertical sections related to the page  */}
          {/* NAVBAR goes here */}
          <NavBar></NavBar>
          {/* 11. create components directory, add navbar.tsx file */}
          {/* 14. make Disconnected component  */}
          <Spacer />
          <Center>
            {/* 10. conditional for view, depending on whether wallet is connected */}
            {/* 17. put disconnected in here */}
            {/* 34. conditional  */}
            {connected ? <Connected/> : <Disconnected/>}
            {/* <Disconnected></Disconnected> */}
          </Center>

          <Spacer/>
          <Center>
            <Box marginBottom={4} color="white">  
              <a href="https://twitter.com/omid" target="_blank" rel="noopener noreferrer">
                Built with Buildspace
              </a>
            </Box>
          </Center>
        </Stack>
      </Box>
    </div>
  )
}

export default Home
