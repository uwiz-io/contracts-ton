import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell, Builder } from "ton-core";
import { OPS } from "./ops"


export default class NftSingle implements Contract {

  static createForDeploy(code: Cell, ownerAddress: Address, editorAddress: Address, content: Cell | Builder, royaltyParams: Cell | Builder): NftSingle {
    const data = beginCell()
      .storeAddress(ownerAddress) // owner_address
      .storeAddress(editorAddress) // editor_address
      .storeRef(content) // ref to content
      .storeRef(royaltyParams) // ref to royalty_params
      .endCell();
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new NftSingle(address, { code, data });
  }

  constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.01", // send 0.01 TON to contract for rent
      bounce: false
    });
  }

  static transferBody(newOwnerAddress: Address): Cell {
    return beginCell()
      .storeUint(OPS.transfer, 32) // op: transfer ownership
      .storeUint(0, 64) // query_id
      .storeAddress(newOwnerAddress) // new nft owner address
      .storeAddress(newOwnerAddress) // responseDestenation
      .storeInt(0, 1) // this nft don't use custom_payload
      .storeCoins(0) // forward_amount
      .endCell();
  }

  async sendTransfer(provider: ContractProvider, via: Sender, reciver: Address) {
    const messageBody = NftSingle.transferBody(reciver)
    await provider.internal(via, {
      value: "0.002", // send 0.002 TON for gas
      body: messageBody
    });
  }

  async getNftData(provider: ContractProvider) {
    const { stack } = await provider.get("get_nft_data", []);
    return {
      init: stack.readNumber(),
      index: stack.readNumber(),
      collectionAddress: stack.readAddress(),
      ownerAddress: stack.readAddress(),
      content: stack.readString()
    }
  }
  
  async getRoyaltyParams(provider: ContractProvider) {
    const { stack } = await provider.get("royalty_params", []);
    // https://github.com/ton-blockchain/TEPs/blob/master/text/0066-nft-royalty-standard.md#guide
    return {
      numerator: stack.readNumber(),
      denominator: stack.readNumber(),
      royaltyAddress: stack.readAddress(),
    }
  }

  async getEditor(provider: ContractProvider) {
    const { stack } = await provider.get("get_editor", []);
    return stack.readAddress();
  }
}
