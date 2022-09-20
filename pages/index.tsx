import type { NextPage } from 'next'
// import Head from 'next/head'
// import styles from '../styles/Home.module.css'

// // 5. import chakra ui components
// import { Box, Center, Spacer, Stack } from "@chakra-ui/react"

// // 13. import Navbar
// import NavBar from "../components/Navbar"

// 16. import Disconnected
import Disconnected from '../components/Disconnected'

// 32. import connected 
import Connected from '../components/Connected'
import { useWallet } from '@solana/wallet-adapter-react'

// 65. import MainLayout 
import MainLayout from "../components/MainLayout"

const Home: NextPage = () => {

  // 33. need conditional re connected/disconnected 
  const {connected} = useWallet()

  return (
    
          <MainLayout>
            {/* 10. conditional for view, depending on whether wallet is connected */}
            {/* 17. put disconnected in here */}
            {/* 34. conditional  */}
            {connected ? <Connected/> : <Disconnected/>}
            {/* <Disconnected></Disconnected> */}
          </MainLayout>


  )
}

export default Home
