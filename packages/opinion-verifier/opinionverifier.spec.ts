import * as fs from "fs";
import { Cell, toNano } from "ton-core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";
import OpinionVerifier from "./opinionverifier"; // interface class

describe("OpinionVerifier tests", () => {
  let blockchain: Blockchain;
  let wallet1: SandboxContract<TreasuryContract>;
  let counterContract: SandboxContract<OpinionVerifier>;

  beforeEach(async () =>  {
    // prepare OpinionVerifier's initial code and data cells for deployment
    const counterCode = Cell.fromBoc(fs.readFileSync("../contracts/opinion-verifier/opinion-verifier.cell"))[0]; // compilation output from tutorial 2
    const counter = OpinionVerifier.createForDeploy(counterCode);

    // initialize the blockchain sandbox
    blockchain = await Blockchain.create();

    // uncomment for a more verbose chain
    // blockchain.verbosity = {
    //     blockchainLogs: true,
    //     vmLogs: "vm_logs_full",
    //     debugLogs: true,
    //     print: true,
    //   }

    wallet1 = await blockchain.treasury("user1");

    // deploy counter
    counterContract = blockchain.openContract(counter);
    await counterContract.sendDeploy(wallet1.getSender());
  }),

  it("should get initial hash value = 0", async () => {
    const value = await counterContract.getHash();
    expect(value).toEqual(0n);
  });

  it("should send ton coin to the contract", async () => {
    console.log("sending 7.123 TON");
    await wallet1.send({
      to: counterContract.address,
      value: toNano("7.123")
    });
  });

  it("should change hash value to sha256('hello world')", async () =>  {
    await counterContract.sendIncrement(wallet1.getSender(), "hello world");
    const counterValue = await counterContract.getHash();
    expect(counterValue).toEqual(83814198383102558219731078260892729932246618004265700685467928187377105751529n);
  })

  it("should change hash value to sha256('another string')", async () =>  {
    await counterContract.sendIncrement(wallet1.getSender(), "another string");
    const counterValue = await counterContract.getHash();
    expect(counterValue).toEqual(58757399233265749576496970889828891165277176610564091722293679610199217478816n);
  })

  it("should change hash value twice", async () =>  {
    await counterContract.sendIncrement(wallet1.getSender(), "string number 1");
    await counterContract.sendIncrement(wallet1.getSender(), "string number 2");
    const counterValue = await counterContract.getHash();
    const hash1 = 85617597652922938203146612095153872869643404540777009106229100113798612621228n;
    const hash2 = 70766656896111781296633975175188847294544542690326144552356215614455781813196n;
    expect(counterValue).toEqual(hash1 ^ hash2);
  })
});