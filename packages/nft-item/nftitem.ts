import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell, Builder } from "ton-core";
import { OPS } from "./ops"


export default class NftItem implements Contract {

  static createForDeploy(code: Cell, index: number, collection: Address, owner: Address, content: Cell): NftItem {
    const data = beginCell()
      .storeUint(index, 64)
      .storeAddress(collection) // collection_address
      .storeAddress(owner) // owner_address
      .storeRef(content) // ref to content
      .endCell();
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new NftItem(address, { code, data });
  }

  constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.01", // send 0.01 TON to contract for rent
      bounce: false
    });
  }

  static transferBody(newOwner: Address, responseDestenation: Address): Cell {
    return beginCell()
      .storeUint(OPS.transfer, 32) // op: transfer ownership
      .storeUint(0, 64) // query_id
      .storeAddress(newOwner) // new_owner_address
      .storeAddress(responseDestenation) // response_destination
      .storeInt(0, 1) // this nft don't use custom_payload
      .storeCoins(0) // forward_amount
      .endCell();
  }

  async sendTransfer(provider: ContractProvider, via: Sender, reciver: Address) {
    const messageBody = NftItem.transferBody(reciver, reciver)
    await provider.internal(via, {
      value: "0.9", // send 0.9 TON for gas
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

}
