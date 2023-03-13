// npx ts-node testapi_own_interface.ts

import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "ton";
import NftItem from "./nftitem"; // interface class
require('dotenv').config();

const CHAIN = "mainnet"
const CONTERACT_ADDRESS = "EQBeIW62S_msBg2tvUPHqcMuioz0ZfyFr2SjEvG41AIGh19s" 
// https://tonscan.org/address/EQBeIW62S_msBg2tvUPHqcMuioz0ZfyFr2SjEvG41AIGh19s
// https://getgems.io/collection/EQCahDNOxYQCIliYhK9xFag2Ho1cASXLMK4RYEQlfitJ-7JC/EQBeIW62S_msBg2tvUPHqcMuioz0ZfyFr2SjEvG41AIGh19s


async function sendBurnMessage() {
  // initialize ton rpc client on CHAIN (testnet/mainnet)
  const endpoint = await getHttpEndpoint({ network: CHAIN });
  const client = new TonClient({ endpoint });
  
  const contract = new NftItem(
    Address.parse(CONTERACT_ADDRESS) // nft-item contract address
  );

  const jettonWalletContract = client.open(contract);
  let currentNum = await jettonWalletContract.getNftData();
  console.log("wallet jetton count:")
  console.log(JSON.stringify(currentNum));
}

sendBurnMessage();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


