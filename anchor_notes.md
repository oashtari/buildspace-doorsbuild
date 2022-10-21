solution code: https://github.com/jamesrp13/buildspace-buildoors/tree/solution-core-5
local files: anchor/anchor-nft-staking

301. copy over idl into the untils folder from target/idl folder
302. copy over idl in ts form as well from target/types folders
303. copy over MockWallet file
304. new component for our workspace provider, code copied per James
305. add workspace procider to _app.tsx
306. our intention here is to replace solana core code with anchor code, which is applicable to where transactions are happening
307. import anchor
308. get anchor from workspaace provider
309. add check for workspace
310. create pda and fetch it for account
311. update accounts.ts in utils
312. replace program id in workspace provider
313. changes in stake
314. changes in unstake
315. changes in claim
316. can delete the instructions file in utils
317. can clean up the imports for all things we're not using
318. go to tokens/bld/index replace the program id, then run npm run create-grc-token as redeem won't work since we'll be using the wrong minting authority, the pda previously set at the authority is no longer valid for this new pgroam, so won't be able to sign to authorize new tokens
319. grab mint address from cache.json and add it to .env variable 
320. can also grab program id from workspace provider, put in .env, so that PROGRAM ID can be pulled from utils constants 