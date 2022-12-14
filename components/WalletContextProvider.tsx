// 20. start blockchain with wallet context provider 

// 21. all these imports

import {FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
require("@solana/wallet-adapter-react-ui/styles.css")

// 22. start with functional component for wallet context provider

const WalletContextProvider: FC<{children: ReactNode}> = ({children}) => {

    // 23. create url and phantom, as the providers need them 

    const url = useMemo(() => clusterApiUrl('devnet'), [])
    // 84. add a useMemo here so this doesn't keep getting built , add autoconnect propr to WalletProvider below
    const phantom = useMemo(() => new PhantomWalletAdapter(),[])

    return(
        <ConnectionProvider endpoint={url}>
            <WalletProvider wallets={[phantom]} autoConnect={true}>
                <WalletModalProvider>
                    { children }
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>

    )
}

export default WalletContextProvider