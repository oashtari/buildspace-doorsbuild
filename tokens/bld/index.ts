// 35. created tokens folder , inside it bld and candy-machine folder ; inside bld an assets folder with an index.ts 
// 36. go into tsconfig.json and change module from esnext to commonjs
// 37. add in boilerplate from other projects
// 38. do imports, also get initialize keypair file
// 41. do this install npm i @metaplex-foundation/js @solana/spl-token

import * as web3 from "@solana/web3.js"
import {initializeKeypair} from "./initializeKeypair"
import * as token from "@solana/spl-token"
import {
    bundlrStorage,
    findMetadataPda,
    keypairIdentity,
    Metaplex,
    toMetaplexFile,
} from "@metaplex-foundation/js"
import {
    DataV2,
    createCreateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata"
import * as fs from "fs"
import { machine } from "os"

// 43. create constants for other variables we need 

const TOKEN_NAME = "GRACIE"
const TOKEN_SYMBOL = "GRC"
const TOKEN_DESCRIPTION = "A token for puppy lovers."
const TOKEN_IMAGE_PATH = "tokens/bld/assets/other_gracie.png"
const TOKEN_IMAGE_NAME = "other_gracie.png"

// 42. helper function to create token
async function createGrcToken(
    connection: web3.Connection,
    payer: web3.Keypair,
    // 101. this is related to step 32 in the solana nft staking program, in the ts/src/index.ts file for when the const stakeMint is created with a new web3 publickey
    programId: web3.PublicKey,
    // 102. then go to call site in main and pass in the public key, which is the program ID you get when you deploy the nft staking program
) {
    // 103. go into the redeem function in nft staking, grab the auth word which is 'mint'
    const [mintAuth] = await web3.PublicKey.findProgramAddress([Buffer.from("mint")], programId)
    // 44. create mint 
    // 104. the const above replaces the 3rd argument below
    const tokenMint = await token.createMint(
        connection, 
        payer, 
        payer.publicKey, //replaced by mintAuth
        // mintAuth, this was an error, still need it to be use for updating the metadata
        payer.publicKey, 
        2)


    // 45. create metaplex object 
    const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(bundlrStorage(
        {
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000
    }
    ))

    // 46. read in image file for token image 
    const imageBuffer = fs.readFileSync(TOKEN_IMAGE_PATH)

    // 47. turn it into a metaplex file 
    const file = toMetaplexFile(imageBuffer, TOKEN_IMAGE_NAME)

    // 48. upload that image 
    const imageUri = await metaplex.storage().upload(file)

    // 49. next upload the rest of offchain metadata 
    const { uri } = await metaplex.nfts().uploadMetadata({
        name: TOKEN_NAME,
        description: TOKEN_DESCRIPTION,
        image: imageUri,
    }).run()

    // 50. find address where metadata will be stored 
    const metadataPda = findMetadataPda(tokenMint)

    // 51. create metadata object  and cast as DataV2 object
    const tokenMetadata = {
        name: TOKEN_NAME, 
        symbol: TOKEN_SYMBOL,
        uri: uri,
        sellerFeeBasisPoints: 0,
        creators: null, 
        collection: null, 
        uses: null, 
    } as DataV2

    // 52. create instruction 
    const instruction = createCreateMetadataAccountV2Instruction(
        {
            metadata: metadataPda,
            mint: tokenMint,
            mintAuthority: payer.publicKey,
            payer: payer.publicKey,
            updateAuthority: payer.publicKey
        },
        {
            createMetadataAccountArgsV2: {
                data: tokenMetadata,
                isMutable: true
            }

        }
    )

    // 53. create transaction and add instruction
    const transaction = new web3.Transaction()
    transaction.add(instruction)

    const transactionSignature = await web3.sendAndConfirmTransaction(
        connection, 
        transaction,
        [payer]
    )

    // 105.
    await token.setAuthority(
        connection,
        payer,
        tokenMint,
        payer.publicKey,
        token.AuthorityType.MintTokens, 
        mintAuth,
    )

    // 54. last thing with this token is to write to file some of the info so we can find it later 
    fs.writeFileSync(
        "tokens/bld/cache.json",
        JSON.stringify({
            mint: tokenMint.toBase58(),
            imageUri: imageUri,
            metadataUri: uri,
            tokenMetadata: metadataPda.toBase58(),
            metadataTransaction: transactionSignature,
        })
    )
}
async function main() {
    const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
    const payer = await initializeKeypair(connection)

    // 55. call token function 
    await createGrcToken(connection, payer, new web3.PublicKey("46P4YDkAMoaC7WQR1N7fyoU8HPNjD1eZq85NmmMzdi55"))
    // 56. npm i --save-dev ts-node 
    // 57. to go package json and add to scripts "create-grc-token": "ts-node ./tokens/bld/index.ts" 
    // 58. add assets under candy-machine, includes the images png files and related json info files + the collection image and json 
    // 59. switch into tokens/candy-machine, then do 'sguar launch', answer all questions and it shoul do the rest
    // 60 starting UI work for minting NFTs , adding script in package .json  to reset NFTs after use, go to directory and run sugar launch
}

main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })