import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "ton-core";
import { OPS } from "./ops"

export default class OpinionVerifier implements Contract {

  static createForDeploy(code: Cell, owner: Address): OpinionVerifier {
    const data = beginCell()
      .storeUint(0, 256)
      .storeAddress(owner)
      .endCell();
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new OpinionVerifier(address, { code, data });
  }

  constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.01", // send 0.01 TON to contract for rent
      bounce: false
    });
  }

  async getInfo(provider: ContractProvider) {
    const { stack } = await provider.get("get_info", []);
    return {
      hash: stack.readBigNumber(),
      owner: stack.readAddress(),
    };
  }

  async getState(provider: ContractProvider) {
    return await provider.getState()
  }

  async sendPredictionString(provider: ContractProvider, via: Sender, string: string) {
    const messageBody = beginCell()
      .storeUint(OPS.receive_prediction_string, 32) // op
      .storeUint(0, 64) // query id
      .storeStringTail(string)
      .endCell();
    await provider.internal(via, {
      value: "0.04", // send 0.02 TON for gas
      body: messageBody
    });
  }

  async sendRefund(provider: ContractProvider, via: Sender) {
    const messageBody = beginCell()
      .storeUint(OPS.pay_balance_back, 32) // op
      .storeUint(0, 64) // query id
      .endCell();
    await provider.internal(via, {
      value: "0.02", // send 0.02 TON for gas
      body: messageBody
    });
  }
}
