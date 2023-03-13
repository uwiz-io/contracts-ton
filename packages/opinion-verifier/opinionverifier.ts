import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "ton-core";

export default class Counter implements Contract {

  static createForDeploy(code: Cell): Counter {
    const data = beginCell()
      .storeUint(0, 256)
      .endCell();
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new Counter(address, { code, data });
  }

  constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.01", // send 0.01 TON to contract for rent
      bounce: false
    });
  }

  async getHash(provider: ContractProvider) {
    const { stack } = await provider.get("get_hash", []);
    return stack.readBigNumber();
  }

  async sendIncrement(provider: ContractProvider, via: Sender, string: string) {
    const messageBody = beginCell()
      .storeUint(1, 32) // op (op #1 = increment)
      .storeUint(0, 64) // query id
      .storeStringTail(string)
      .endCell();
    await provider.internal(via, {
      value: "0.002", // send 0.002 TON for gas
      body: messageBody
    });
  }
}
