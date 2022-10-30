import { web3 } from "@project-serum/anchor";
import { initializeKeypair } from "../bld/initializeKeypair";
import * as token from "@solana/spl-token";
import {bundlrStorage, findMetadataPda, keypairIdentity, Metaplex, toMetaplexFile} from "@metaplex-foundation/js";
import * as fs from "fs";
import { createCreateMetadataAccountV2Instruction, DataV2 } from "@metaplex-foundation/mpl-token-metadata";


async function createGear(
    connection: web3.Connection,
    payer: web3.Keypair,
    programId: web3.PublicKey,
    assets: Array<string>
) {
    // empty object for mints
    let collection: any = {}

    const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
        bundlrStorage({
            address: "https://devnet.bundlr.network",
            providerUrl: "https://api.devnet.solana.com",
            timeout: 60000,
        })
    )

    for(let i=0; i < assets.length; i++) {
        let mints: Array<string> = []

        // grabbing and uploading image buffer to arweave
        const imageBuffer = fs.readFileSync(`tokens/gear/assets/${assets[i]}.png`)
        const file = toMetaplexFile(imageBuffer,`${assets[i]}.png`)
        const imageUri = await metaplex.storage().upload(file)

        // can set middle variable to higher number to get multiple bows
        for (let xp=10; xp<=10; xp+=10){
            // grabs mint auth, this is the pda on the program that we want to be doing the minting, this becomes pda for lootbox program
            const [mintAuth] = await web3.PublicKey.findProgramAddress(
                [Buffer.from("mint")],
                programId
            )

            const tokenMint = await token.createMint(
                connection,
                payer,
                payer.publicKey,
                payer.publicKey,
                0 // means a non-divisible asset
            )

            mints.push(tokenMint.toBase58())

            // upload metadata
            const {uri} = await metaplex
            .nfts()
            .uploadMetadata({
                names: assets[i],
                description: "Gear that levels up your Gracie",
                image: imageUri,
                attributes: [
                    {
                        trait_type: "xp",
                        value: `${xp}`,
                    },
                ],
            })
            .run()

            // grab metadata pda for that mint
            const metadataPda = await findMetadataPda(tokenMint)

            // on chain portion of metadata
            const tokenMetaData = {
                name: assets[i],
                symbol: "GRC-GEAR",
                uri: uri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
            } as DataV2

            const instruction = createCreateMetadataAccountV2Instruction(
                {
                    metadata: metadataPda,
                    mint: tokenMint,
                    mintAuthority: payer.publicKey, // starts as payer, gets changed later
                    payer: payer.publicKey,
                    updateAuthority: payer.publicKey
                },
                {
                    createMetadataAccountArgsV2: {
                        data: tokenMetaData,
                        isMutable: true,
                    },
                }
            )

            const transaction = new web3.Transaction()
            transaction.add(instruction)

            const transactionSignature = await web3.sendAndConfirmTransaction(
                connection,
                transaction,
                [payer],
            )

            // set authorty to mint Auth, that's the pda on the lootbox program we computed earlier
            await token.setAuthority(
                connection,
                payer,
                tokenMint,
                payer.publicKey,
                token.AuthorityType.MintTokens,
                mintAuth
            )
        }
        collection[assets[i]] = mints
    }
    
    // writing to file entire collection object so we can keep track of this stuff

    fs.writeFileSync("tokens/gear/cache.json", JSON.stringify(collection))
    
}

async function main() {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
    const payer = await initializeKeypair(connection);

    await createGear(
        connection,
        payer,
        new web3.PublicKey("46P4YDkAMoaC7WQR1N7fyoU8HPNjD1eZq85NmmMzdi55"),
        ["Bow", "Glasses", "Hat", "Keyboard", "Mustache"]
    )
}

main()
.then(() => {
    console.log("finished SUCCESSFULLY");
    process.exit(0)
})
.catch((e) => {
    console.log(e);
    process.exit(1)
})