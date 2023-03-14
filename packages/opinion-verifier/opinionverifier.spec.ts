import * as fs from "fs";
import { Cell, toNano } from "ton-core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton-community/sandbox";
import OpinionVerifier from "./opinionverifier"; // interface class

describe("OpinionVerifier tests", () => {
  let blockchain: Blockchain;
  let wallet1: SandboxContract<TreasuryContract>;
  let wallet2: SandboxContract<TreasuryContract>;
  let opinionVerifierContract: SandboxContract<OpinionVerifier>;

  beforeEach(async () =>  {
    // prepare OpinionVerifier's initial code and data cells for deployment
    const opinionVerifierCode = Cell.fromBoc(fs.readFileSync("../contracts/opinion-verifier/opinion-verifier.cell"))[0]; // compilation output from tutorial 2
    blockchain = await Blockchain.create();
    wallet1 = await blockchain.treasury("user1");
    wallet2 = await blockchain.treasury("user2");

    const opinionVerifier = OpinionVerifier.createForDeploy(opinionVerifierCode, wallet1.address);

    // initialize the blockchain sandbox

    // uncomment for a more verbose chain
    // blockchain.verbosity = {
    //     blockchainLogs: true,
    //     vmLogs: "vm_logs_full",
    //     debugLogs: true,
    //     print: true,
    //   }


    // deploy opinionVerifier
    opinionVerifierContract = blockchain.openContract(opinionVerifier);
    await opinionVerifierContract.sendDeploy(wallet1.getSender());
  }),

  it("should get initial hash value = 0", async () => {
    const value = await opinionVerifierContract.getInfo();
    expect(value.hash).toEqual(0n);
  });

  it("should get owner address", async () => {
    const value = await opinionVerifierContract.getInfo();
    expect(value.owner.toString()).toEqual(wallet1.address.toString());
  });

  it("should send ton coin to the opinionVerifier", async () => {
    console.log("sending 7.123 TON");
    await wallet1.send({
      to: opinionVerifierContract.address,
      value: toNano("7.123")
    });
  });

  it("should change hash value to sha256('hello world')", async () =>  {
    await opinionVerifierContract.sendPredictionString(wallet1.getSender(), "hello world");
    const opinionVerifierValue = await opinionVerifierContract.getInfo();
    expect(opinionVerifierValue.hash).toEqual(83814198383102558219731078260892729932246618004265700685467928187377105751529n);
  })

  it("should change hash value to sha256('another string')", async () =>  {
    await opinionVerifierContract.sendPredictionString(wallet1.getSender(), "another string");
    const opinionVerifierValue = await opinionVerifierContract.getInfo();
    expect(opinionVerifierValue.hash).toEqual(58757399233265749576496970889828891165277176610564091722293679610199217478816n);
  });

  it("should change hash value twice", async () =>  {
    await opinionVerifierContract.sendPredictionString(wallet1.getSender(), "string number 1");
    await opinionVerifierContract.sendPredictionString(wallet1.getSender(), "string number 2");
    const opinionVerifierValue = await opinionVerifierContract.getInfo();
    const hash1 = 85617597652922938203146612095153872869643404540777009106229100113798612621228n;
    const hash2 = 70766656896111781296633975175188847294544542690326144552356215614455781813196n;
    expect(opinionVerifierValue.hash).toEqual(hash1 ^ hash2);
  });

  it("should send ton coin to the opinionVerifier", async () => {
    console.log("sending 7.123 TON");
    await wallet1.send({
      to: opinionVerifierContract.address,
      value: toNano("7.123")
    });
    const value = (await blockchain.getContract(opinionVerifierContract.address)).balance
    console.log(value)
    expect(value).toBeGreaterThan(7000000000n);
    expect(value).toBeLessThan(8000000000n);
  });

  it("should send excess ton balance to owner wallet", async () => {
    console.log("sending 7.123 TON");
    await wallet1.send({
      to: opinionVerifierContract.address,
      value: toNano("7.123")
    });

    await opinionVerifierContract.sendRefund(wallet1.getSender());
    
    const value = (await blockchain.getContract(opinionVerifierContract.address)).balance
    expect(value).toBeLessThan(50000000n)
  });

  it("should fail to send ton balance because called by someone other than owner", async () => {
    console.log("sending 7.123 TON");
    await wallet1.send({
      to: opinionVerifierContract.address,
      value: toNano("7.123")
    });

    await opinionVerifierContract.sendRefund(wallet2.getSender());
    
    const value = (await blockchain.getContract(opinionVerifierContract.address)).balance

    expect(value).toBeGreaterThan(7000000000n);
    expect(value).toBeLessThan(8000000000n);
  });
});
