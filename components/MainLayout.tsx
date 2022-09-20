// 61. create this new file to move the primary layout into 
// 62. import FC from react 
// 63. copy everything from index.tsx in pages/api except the connected/disconnect logic, as well as all the imports

import { FC, ReactNode } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { Box, Center, Spacer, Stack } from "@chakra-ui/react"
import NavBar from "../components/Navbar"
import { useWallet } from '@solana/wallet-adapter-react'

const MainLayout: FC<{children: ReactNode}> = ({children}) => {
    // 64. add this back in 
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
         
            <Center>{children}</Center>
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

export default MainLayout