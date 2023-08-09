"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const alchemy_sdk_1 = require("alchemy-sdk");
require("dotenv/config");
const config = {
    apiKey: process.env.ACESS_KEY,
    network: alchemy_sdk_1.Network.ETH_MAINNET,
    maxRetries: 2000 // Replace with your network.
};
const alchemy = new alchemy_sdk_1.Alchemy(config);
const getTransfer = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield alchemy.core.getAssetTransfers({
        fromBlock: "0x0",
        fromAddress: process.env.ACCOUNT_ADDRESS,
        category: [alchemy_sdk_1.AssetTransfersCategory.EXTERNAL, alchemy_sdk_1.AssetTransfersCategory.ERC1155, alchemy_sdk_1.AssetTransfersCategory.ERC20, alchemy_sdk_1.AssetTransfersCategory.ERC721, alchemy_sdk_1.AssetTransfersCategory.INTERNAL],
        withMetadata: true,
    });
    const jsonData = JSON.stringify(data);
    return JSON.parse(jsonData);
});
exports.default = getTransfer;
