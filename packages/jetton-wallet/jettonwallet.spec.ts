import * as fs from "fs";
import { Address, Cell, toNano } from "ton-core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";
import JettonWallet from "./jettonwallet"; // interface class

describe("Counter tests", () => {
  let blockchain: Blockchain;
  let wallet1: SandboxContract<TreasuryContract>;
  let wallet2: SandboxContract<TreasuryContract>;
  let counterContract: SandboxContract<JettonWallet>;

  beforeEach(async () =>  {
    // initialize the blockchain sandbox
    blockchain = await Blockchain.create();

    // initilaze wallet
    wallet1 = await blockchain.treasury("user1");

  
    // prepare jetton wallet's initial code and data cells for deployment
    const contractCode = Cell.fromBoc(fs.readFileSync("../contracts/jettons/jetton-wallet.cell"))[0]; // compilation output from tutorial 2
    const initialJettonCount = 110000000000; // no collisions possible since sandbox is a private local instance
    const contract = JettonWallet.createForDeploy(contractCode, initialJettonCount, wallet1.address, Address.parse("EQBDrVnD6dDRWaMBY4TpWnMz4tUgfoC-htNhj-Z5nLoH8BZP"));

    // uncomment for a more verbose chain
    // blockchain.verbosity = {
    //     blockchainLogs: true,
    //     vmLogs: "vm_logs_full",
    //     debugLogs: true,
    //     print: true,
    //   }

    // deploy counter
    counterContract = blockchain.openContract(contract);
    await counterContract.sendDeploy(wallet1.getSender());
  }),

  it("should get total jetton count", async () => {
    const value = await counterContract.getWalletJettons();
    expect(value).toEqual(110000000000n);
  });

  it("should burn 10 jettons", async () => {
    // fails for now, probably because it can't reach jetton master (it's a fake ref)
    await counterContract.sendBurn(wallet1.getSender(), 10000000000);
    const value = await counterContract.getWalletJettons();
    expect(value).toEqual(109000000000n);
  });

  it("should transfer 10 jettons", async () => {
    // fails for now, probably because it can't reach jetton master (it's a fake ref)
    wallet2 = await blockchain.treasury("user2");

    await counterContract.sendTransfer(wallet1.getSender(), wallet2.address);
    const value = await counterContract.getWalletJettons();
    expect(value).toEqual(109000000000n);
  });
});
