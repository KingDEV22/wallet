import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import "dotenv/config";
const config = {
  apiKey: process.env.ACESS_KEY, // Replace with your Alchemy API key.
  network: Network.ETH_MAINNET,
  maxRetries: 2000 // Replace with your network.
};

const alchemy = new Alchemy(config);

const getTransfer = async ()  => {
  const data = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    fromAddress: process.env.ACCOUNT_ADDRESS,
    category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC1155, AssetTransfersCategory.ERC20,AssetTransfersCategory.ERC721,AssetTransfersCategory.INTERNAL],
    withMetadata: true,
  });
  const jsonData = JSON.stringify(data)
  
  return JSON.parse(jsonData);
};

export default getTransfer;
