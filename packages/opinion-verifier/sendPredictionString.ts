import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, Cell, WalletContractV4 } from "ton";
import OpinionVerifier from "./opinionverifier"; // interface class
require('dotenv').config();

const CHAIN = "testnet"

async function deploy() {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: CHAIN });
  const client = new TonClient({ endpoint });

  // open wallet v4 (notice the correct wallet version here)
  // const mnemonic = "unfold sugar water ..."; // your 24 secret words (replace ... with the rest of the words)
  const mnemonic = process.env.MNEMONIC || ""

  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  if (!await client.isContractDeployed(wallet.address)) {
    return console.log("wallet is not deployed");
  }
  console.log(wallet.address.toString())

  // prepare OpinionVerifier's initial code and data cells for deployment
  const opinionVerifierCode = Cell.fromBase64("te6cckEBBQEAtAABFP8A9KQT9LzyyAsBAgFiAgMBntAyIccAkVvg0NMDMfpAMO1E0NP/+kAwUSLHBfLhkQLTH9M/MYIQFvJBu1Iguo4Q+QJQA7IhAcjL/wHPFsntVJIwMuKCEKbkPlkSupEw4w0EABWhS8PaiaGn//SAYQCC+CdvIjCCCvrwgKEgwv/y4FCNBZGdW5kIGJhY2sgZnJvbSBjb3VudGVygcIAYyMsFUATPFlj6AhLLagHPFsly+wCbo58r");
  // const opinionVerifierCode = Cell.fromBoc(fs.readFileSync("../contracts/opinion-verifier/opinion-verifier.cell"))[0]; // compilation output from step 6
  opinionVerifierCode.toBoc().toString("base64")
  console.log(opinionVerifierCode)
  const opinionVerifier = OpinionVerifier.createForDeploy(opinionVerifierCode, wallet.address);

  // exit if contract is already deployed
  console.log("contract address:", opinionVerifier.address.toString());
  if (await client.isContractDeployed(opinionVerifier.address)) {
    console.log("OpinionVerifier already deployed");
  } else {
    return console.log("OpinionVerifier not deployed");
  }

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletBalance = await walletContract.getBalance();
  console.log(`Wallet balance: ${walletBalance}`);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  // send the deploy transaction
  const opinionVerifierContract = client.open(opinionVerifier);
  const state= await opinionVerifierContract.getState();
  console.log(state.balance)
  console.log(state.last)
  console.log(state.state)

  await opinionVerifierContract.sendPredictionString(walletSender, "41 The Open Network buy 1679072227 1679075827 2.43422 USDT");

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for deploy transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("deploy transaction confirmed!");
}

deploy();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
