import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "ton-core";

export default class Counter implements Contract {

  static createForDeploy(code: Cell, initialCounterValue: number): Counter {
    const data = beginCell()
      .storeUint(initialCounterValue, 64)
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

  async getCounter(provider: ContractProvider) {
    const { stack } = await provider.get("counter", []);
    return stack.readBigNumber();
  }

  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get("balance", []);
    return stack.readBigNumber();
  }

  async sendIncrement(provider: ContractProvider, via: Sender) {
    const messageBody = beginCell()
      .storeUint(1, 32) // op (op #1 = increment)
      .storeUint(0, 64) // query id
      .storeInt(1, 32)
      .endCell();
    await provider.internal(via, {
      value: "0.002", // send 0.002 TON for gas
      body: messageBody
    });
  }

  async sendDecrement(provider: ContractProvider, via: Sender) {
    const messageBody = beginCell()
      .storeUint(2, 32) // op (op #2 = decrement)
      .storeUint(0, 64) // query id
      .storeInt(-1, 32)
      .endCell();
    await provider.internal(via, {
      value: "0.002", // send 0.002 TON for gas
      body: messageBody
    });
  }

  async sendAddNumber(provider: ContractProvider, via: Sender, num: number) {
    const messageBody = beginCell()
      .storeUint(3, 32) // op (op #3 = addNumber)
      .storeUint(0, 64) // query id
      .storeInt(num, 32) // number to be added to counter
      .endCell();
    await provider.internal(via, {
      value: "0.002", // send 0.002 TON for gas
      body: messageBody
    });
  }

  async sendRefund(provider: ContractProvider, via: Sender) {
    const messageBody = beginCell()
      .storeUint(4, 32) // op (op #4 = refund)
      .storeUint(0, 64) // query id
      .endCell();
    await provider.internal(via, {
      value: "0.2", // send 0.002 TON for gas
      body: messageBody
    });
  }
}
