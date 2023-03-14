import * as fs from "fs";
import { Cell, toNano } from "ton-core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";
import OpinionVerifier from "./opinionverifier"; // interface class

describe("OpinionVerifier tests", () => {
  let blockchain: Blockchain;
  let wallet1: SandboxContract<TreasuryContract>;
  let contractContract: SandboxContract<OpinionVerifier>;

  beforeEach(async () =>  {
    // prepare OpinionVerifier's initial code and data cells for deployment
    const contractCode = Cell.fromBoc(fs.readFileSync("../contracts/opinion-verifier/opinion-verifier.cell"))[0]; // compilation output from tutorial 2
    blockchain = await Blockchain.create();
    wallet1 = await blockchain.treasury("user1");
    const contract = OpinionVerifier.createForDeploy(contractCode, wallet1.address);

    // initialize the blockchain sandbox

    // uncomment for a more verbose chain
    // blockchain.verbosity = {
    //     blockchainLogs: true,
    //     vmLogs: "vm_logs_full",
    //     debugLogs: true,
    //     print: true,
    //   }


    // deploy contract
    contractContract = blockchain.openContract(contract);
    await contractContract.sendDeploy(wallet1.getSender());
  }),

  it("should get initial hash value = 0", async () => {
    const value = await contractContract.getInfo();
    expect(value.hash).toEqual(0n);
  });

  it("should get owner address", async () => {
    const value = await contractContract.getInfo();
    expect(value.owner.toString()).toEqual(wallet1.address.toString());
  });

  it("should send ton coin to the contract", async () => {
    console.log("sending 7.123 TON");
    await wallet1.send({
      to: contractContract.address,
      value: toNano("7.123")
    });
  });

  it("should change hash value to sha256('hello world')", async () =>  {
    await contractContract.sendIncrement(wallet1.getSender(), "hello world");
    const contractValue = await contractContract.getInfo();
    expect(contractValue.hash).toEqual(83814198383102558219731078260892729932246618004265700685467928187377105751529n);
  })

  it("should change hash value to sha256('another string')", async () =>  {
    await contractContract.sendIncrement(wallet1.getSender(), "another string");
    const contractValue = await contractContract.getInfo();
    expect(contractValue.hash).toEqual(58757399233265749576496970889828891165277176610564091722293679610199217478816n);
  })

  it("should change hash value twice", async () =>  {
    await contractContract.sendIncrement(wallet1.getSender(), "string number 1");
    await contractContract.sendIncrement(wallet1.getSender(), "string number 2");
    const contractValue = await contractContract.getInfo();
    const hash1 = 85617597652922938203146612095153872869643404540777009106229100113798612621228n;
    const hash2 = 70766656896111781296633975175188847294544542690326144552356215614455781813196n;
    expect(contractValue.hash).toEqual(hash1 ^ hash2);
  })
});
