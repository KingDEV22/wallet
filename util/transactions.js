const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();



let data = JSON.stringify({
  jsonrpc: "2.0",
  id: 0,
  method: "alchemy_getAssetTransfers",
  params: [
    {
      fromBlock: "0x0",
      toBlock: "latest",
      fromAddress: process.env.ACCOUNT_ADDRESS,
      category: ["external", "internal", "erc20", "erc721", "erc1155"],
      withMetadata: true,
    },
  ],
});
// setting the header
var requestOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: data,
  redirect: "follow",
};
const fetchURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ACESS_KEY}`;

// fetch the transactions of a particular ethereum wallet address
const fetchTransactions = async () => {
  try {
    const response = await fetch(fetchURL, requestOptions);
    const data = await response.json();
    return data.result.transfers;
  } catch (error) {
    console.log("error", error);
    return null;
  }
};

module.exports = fetchTransactions;
