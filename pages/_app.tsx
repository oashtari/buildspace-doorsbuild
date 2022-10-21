import type { AppProps } from 'next/app'

// 1. import Chakra and wrap whole app with it
import {ChakraProvider, extendTheme} from "@chakra-ui/react"

// 24. import wallet context provider
import WalletContextProvider from '../components/WalletContextProvider'
import { WorkspaceProvider } from '../components/WorkspaceProvider'


// 2. custom colors for the site
const colors = {
  background: "1F1F1F",
  accent: "833BBE",
  bodyText: "rgba(255,255,255,0.75)",
  // 101.
  secondaryPurple: "#CB8CFF",
  containerBg: "rgba(255,255,255,0.1)",
  containerBgSecondary: "rgba(255,255,255,0.05)",
  buttonGreen: "#7EFFA7",
}

// 3. merge that with chakra with their extend theme
const theme = extendTheme({colors})



function MyApp({ Component, pageProps }: AppProps) {
  return (
  //4. pass in theme as a prop to the provider
  <ChakraProvider theme={theme}>
    {/* 25. add wallet context provider  */}
    <WalletContextProvider>
      <WorkspaceProvider>
        <Component {...pageProps} />
      </WorkspaceProvider>
    </WalletContextProvider>
  </ChakraProvider>
  )
}

export default MyApp
