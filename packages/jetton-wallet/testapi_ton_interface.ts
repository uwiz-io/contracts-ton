// npx ts-node testapi_ton_interface.ts

import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, Address, JettonWallet } from "ton";
require('dotenv').config();

const CHAIN = "mainnet"
const CONTERACT_ADDRESS = "EQA1pw561pChrkfOneucsozHxfmqg4xujB0G3hK0n0kYIRiG"

async function getJettonBalance() {
  // initialize ton rpc client on CHAIN (testnet/mainnet)
  const endpoint = await getHttpEndpoint({ network: CHAIN });
  const client = new TonClient({ endpoint });
  
  const contract = JettonWallet.create(
    Address.parse(CONTERACT_ADDRESS) // jetton wallet contract address
  );

  // open wallet v4 (notice the correct wallet version here)
  const mnemonic = process.env.MNEMONIC || ""

  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  if (!await client.isContractDeployed(wallet.address)) {
    // would get this if mnemonics are wrong
    return console.log("wallet is not deployed");
  }

  const jettonWalletContract = client.open(contract);
  let currentNum = await jettonWalletContract.getBalance();
  console.log(`wallet jetton count: ${currentNum}`);
}

getJettonBalance();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


