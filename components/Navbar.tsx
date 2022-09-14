// 12. import FC/functional component, create basic component and export it 
import { FC } from 'react'
import { HStack, Spacer} from "@chakra-ui/react" 
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

// 27. import styling 
import styles from "../styles/Home.module.css"


const NavBar: FC = () => {
    return(
        <HStack width="full" padding={4}>
            <Spacer/>
            {/* 26. replace button with wallet multi button
            <Button>Connect</Button> */}
            {/* 28. adding styling to component  */}
            <WalletMultiButton className={styles["wallet-adapter-button-trigger"]}>

            </WalletMultiButton>
        </HStack>
    )
}

export default NavBar