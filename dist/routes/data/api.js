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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
const transactions_1 = __importDefault(require("../../util/transactions"));
const winston_1 = require("winston");
//logger initialise
const logger = (0, winston_1.createLogger)({
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [new winston_1.transports.Console({})],
    exceptionHandlers: [new winston_1.transports.Console({})],
    rejectionHandlers: [new winston_1.transports.Console({})],
});
//database config
const supabase = (0, supabase_js_1.createClient)("https://vautcfpbwbjpqtwyzmfe.supabase.co", process.env.SUPABASE_KEY, { auth: { persistSession: false }, });
logger.info("Database connected!!");
const router = (0, express_1.Router)();
// middleware to authenticate endpoints
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = req.headers["auth"];
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    const query = supabase.from("tokens").select().eq("token", token);
    const user = yield query;
    if (user.error !== null) {
        logger.error("error", user.error);
        return res.status(400).send("Invalid token");
    }
    if (((_a = user.data) === null || _a === void 0 ? void 0 : _a.length) === 0) {
        logger.warn("token invalid!!!!");
        return res.status(400).send("token invalid");
    }
    return next();
});
// to add the transaction data of respective ethereum wallet address
router
    .route("/data")
    .post(verifyToken, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, transactions_1.default)();
        logger.info("Transaction data fetched..");
        if (data == null) {
            logger.warn("No data found!!!");
            return res.status(400).send("no data found!!!");
        }
        logger.info("Data filtered..");
        const transformedData = data.transfers.map((transaction) => {
            return {
                uniqueId: transaction.uniqueId,
                blockNum: transaction.blockNum,
                hash: transaction.hash,
                sender: transaction.from,
                receiver: transaction.to,
                value: transaction.value,
                asset: transaction.asset,
                category: transaction.category,
                date: transaction.metadata.blockTimestamp,
            };
        });
        const { error } = yield supabase
            .from("transaction")
            .insert(transformedData);
        if (error) {
            logger.error("", error);
            return res.status(400).json({ error: error });
        }
        res.status(201).json({ message: "created data", data: transformedData });
    }
    catch (error) {
        logger.error("", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// to get the most contacted address
router
    .route("/report")
    .get(verifyToken, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = supabase
        .from("transaction")
        .select("hash,receiver,date")
        .order("date", { ascending: false })
        .limit(1000);
    const transactions = yield query;
    if (transactions.error) {
        logger.error("", transactions.error);
        return res.status(400).json({ error: transactions.error });
    }
    const data = transactions.data;
    const toAddressCount = data.reduce((count, transaction) => {
        const toAddress = transaction.receiver;
        if (toAddress !== null) {
            count[toAddress] = (count[toAddress] || 0) + 1;
        }
        return count;
    }, {});
    let maxToAddress = null;
    let maxCount = 0;
    for (const [address, count] of Object.entries(toAddressCount)) {
        if (count > maxCount) {
            maxCount = count;
            maxToAddress = address;
        }
    }
    const maxAddressTransactions = data.filter((transaction) => transaction.receiver === maxToAddress);
    maxAddressTransactions.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : null;
        const dateB = b.date ? new Date(b.date) : null;
        if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
        }
        else if (!dateA && dateB) {
            return 1;
        }
        else if (dateA && !dateB) {
            return -1;
        }
        else {
            return 0;
        }
    });
    const reportTransaction = maxAddressTransactions[0];
    if (!reportTransaction) {
        logger.warn("no data found!!!");
        return res.status(400).json({ message: "no data found!!!!" });
    }
    if (reportTransaction.date) {
        reportTransaction.date = new Date(reportTransaction.date).toLocaleString();
    }
    else {
        reportTransaction.date = "N/A";
    }
    logger.info("Report generated...");
    res.status(200).json({
        max_value_txn_hash: reportTransaction.hash,
        max_txns_with_address: reportTransaction.receiver,
        date_max_txns: reportTransaction.date,
    });
}));
exports.default = router;
