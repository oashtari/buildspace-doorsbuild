1. create 6 file structure: lib, entrypoint, processor, state, error, instruction
2. in lib file, register all the files
3. in entrypoint, do imports
4. bring in processor
5. create process instruction function
6. delcare entrypoint start with process instruction function; the macro expands the process instruction to do what it needs to manage incoming instruction
7. call processor in process instruction code block
8. declare the function we just called inside processor
9. enum for staking instructions in instruction
10. import error for instruction which allows for 11
11. create unpack implemention which sees which instruction data is passed in, currently just an integer
12. back in processor, call unpack
13. match on instruction
14. create all the functions from the match -- don't forget to import instruction 
15. build initialize stake account
16. import next account info
17. create user stake info struct in state file
18. imports related to types of data in the struct
19. enum for the item we didn't import
20. implemention for Sealed
21. implemention for is initialized
22. import borsh
23. derive borsh for user stake info and stake state
24. import items into error
25. build enum and use derive
26. add from trait implementation, this is to conver our own errors into a program error type
27. do pda security check
28. import error crate
29. calculate size of pda account
30. import state into processor
31. get rent amount
32. invoke pda account
33. get account data, by deserializing
34. assign account data
35. serialize account data
36. copy paste accounts from initialize into process as it's quite similar
37. re derive pda for us
38. check if correct pda
39. get data by copy paste from initialize, 
40. except for the is_initialized needs to be a *not* != check
41. set clock
42. for account data, also setting time
43. redeem is quite similar, copy paste account info, pda check, and account creation
44. check whether it can stake
45. check if account data user is same as user key
46. check if nft token matches
47. should be earlier, do a signer check
48. get clock
49. measure time since last redeem
50. set amount 
51. reset some of the data
52. serialize account data
53. copy paste first few steps for unstake
54. check to see if staked
55. copy related clock info
56. reset some value
57. serialize again
58. build
59. deploy
60. test with script that James provided https://github.com/Unboxed-Software/solana-stake-nft-client

solution code in case I need it https://beta.solpg.io/6328b62f77ea7f12846aee9a

code from walk through of exercise https://beta.solpg.io/633303ba77ea7f12846aeea4

program id 7urkbQBqcjgigjQKNCDMXjU92cUQpvR8PXmkvh3Dqsoh
solana explorer https://explorer.solana.com/tx/67V2BEpSi8sCiv6QBxCZEsGVcotn5Crh15zM9hmnMmdEQQTVeXVKGd23AZ3vTyKFv1yARQjUerxoHTKTVJrSxmkD?cluster=devnet



