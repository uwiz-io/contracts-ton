// npx ts-node testapi_own_interface.ts

import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, Address } from "ton";
import JettonWallet from "./jettonwallet"; // interface class
require('dotenv').config();

const CHAIN = "mainnet"
const CONTERACT_ADDRESS = "EQA1pw561pChrkfOneucsozHxfmqg4xujB0G3hK0n0kYIRiG"

async function sendBurnMessage() {
  // initialize ton rpc client on CHAIN (testnet/mainnet)
  const endpoint = await getHttpEndpoint({ network: CHAIN });
  const client = new TonClient({ endpoint });
  
  const contract = new JettonWallet(
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
  let currentNum = await jettonWalletContract.getWalletJettons();
  console.log(`wallet jetton count: ${currentNum}`);

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  // send the burn transaction message
  await jettonWalletContract.sendBurn(walletSender, 1000000000);

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for burn transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("increment burn confirmed!");

  currentNum = await jettonWalletContract.getWalletJettons();
  console.log(`new jetton count: ${currentNum}`);
}

sendBurnMessage();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


