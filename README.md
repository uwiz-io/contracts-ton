# TON Contracts 

Smart Contracts in func we need for 
- Issuing NFT for uwiz league prize 
- Mint UWI tokens
- Issue SBT for proof of prediction

On The Open Network blockchain.

Includes func source code, compiled BOC, TypeScript interfaces, jest tests, and deploy scripts. 

## Setting up development environment

Install a recent version of node (>18) and
Run `npm install` to install all the requirements. Including func compiler (`@ton-community/func-js`), TVM emulator for tests (`@ton-community/sandbox`), access to blockchain (`@orbs-network/ton-access`) and test utils.

Then make a copy of `.env.example` called `.env` and put your wallet's mnemonics and your choice between `mainnet/testnet` there.