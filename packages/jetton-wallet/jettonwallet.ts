import { JettonMaster } from "ton";
import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "ton-core";
import { OPS } from "./ops"


export default class JettonWallet implements Contract {

  static createForDeploy(code: Cell, initialJettonCount: number, ownerAddress: Address, jettonMasterAddress: Address): JettonWallet {
    const data = beginCell()
      .storeCoins(initialJettonCount) // initial jetton count
      .storeAddress(ownerAddress)
      .storeAddress(jettonMasterAddress)
      .endCell();
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new JettonWallet(address, { code, data });
  }

  constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.01", // send 0.01 TON to contract for rent
      bounce: false
    });
  }

  async sendBurn(provider: ContractProvider, via: Sender, amount: number) {
    const messageBody = beginCell()
      .storeUint(OPS.Burn, 32) // op: burn jettons
      .storeUint(0, 64) // query id
      .storeCoins(amount)
      .storeAddress(via.address)
      .endCell();
    await provider.internal(via, {
      value: "0.05", // send 0.05 TON for gas
      body: messageBody
    });
  }

  static transferBody(toOwnerAddress: Address, jettonValue: number): Cell {
    return beginCell()
      .storeUint(OPS.Transfer, 32) // op: outgoing transfer
      .storeUint(0, 64) // queryid
      .storeCoins(jettonValue)
      .storeAddress(toOwnerAddress)
      .storeAddress(null) // TODO RESP?
      .storeDict(null) // custom payload
      .storeCoins(0) // forward ton amount TODO
      .storeMaybeRef(null) // forward payload - TODO??
      .endCell();
  }

  async sendTransfer(provider: ContractProvider, via: Sender, reciver: Address) {
    const messageBody = JettonWallet.transferBody(reciver, 110000000000)
    await provider.internal(via, {
      value: "0.002", // send 0.002 TON for gas
      body: messageBody
    });
  }

  async getWalletData(provider: ContractProvider) {
    const { stack } = await provider.get("get_wallet_data", []);
    return stack;
  }
  
  async getWalletJettons(provider: ContractProvider) {
    const { stack } = await provider.get("get_wallet_data", []);
    return stack.readBigNumber();
  }

}
