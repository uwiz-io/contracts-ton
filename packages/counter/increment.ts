import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, Address } from "ton";
import Counter from "./counter"; // interface class
require('dotenv').config();

const CHAIN = "testnet"
const COUNTER_ADDRESS = "EQA2M1RgLTBDUrjbHV_GUscRTVJgFyBBW5w4p1qlP4EVZbPJ"

async function sendIncrementMessage() {
  // initialize ton rpc client on testnet
  
  const endpoint = await getHttpEndpoint({ network: CHAIN });
  const client = new TonClient({ endpoint });
  
  const contract = new Counter(
    Address.parse(COUNTER_ADDRESS) // counter contract address
  );

  // open wallet v4 (notice the correct wallet version here)
  const mnemonic = process.env.MNEMONIC || ""
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  if (!await client.isContractDeployed(wallet.address)) {
    // would get this if mnemonics are wrong
    return console.log("wallet is not deployed");
  }

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  const counterContract = client.open(contract);
  let currentNum = await counterContract.getCounter();
  console.log(`old Counter value: ${currentNum}`);

  // send the deploy transactions
  await counterContract.sendIncrement(walletSender);

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for increment transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("increment transaction confirmed!");

  currentNum = await counterContract.getCounter();
  console.log(`new Counter value: ${currentNum}`);
}

sendIncrementMessage();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


