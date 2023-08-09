const router = require("express").Router();
const { createClient } = require("@supabase/supabase-js");
const fetchTransactions = require("../../util/transactions");
const winston = require("winston");
const verifyToken = require("../../util/verify");

//logger initialise
const { createLogger, format, transports } = winston;
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({})],
  exceptionHandlers: [new transports.Console({})],
  rejectionHandlers: [new transports.Console({})],
});

//database config
const supabaseUrl = "https://vautcfpbwbjpqtwyzmfe.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

logger.info("Database connected!!");

const filterarray = (array) => {
  return array.map((transaction) => {
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
};

// to add the transaction data of respective ethereum wallet address
router.post("/data", verifyToken, async (req, res) => {
  try {
    const data = await fetchTransactions();
    logger.info("Transaction data fetched..");
    if (data == null) {
      logger.warn("No data found!!!");
      return res.status(400).send("no data found!!!");
    }
    const filterdata = filterarray(data);
    logger.info("Data filtered..");
    const { error } = await supabase.from("transaction").insert(filterdata);
    if (error) {
      logger.error("", error);
      return res.status(400).json({ error: error.details[0].message });
    }
    res.status(201).json({ message: "created data", data: filterdata });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// to get all the transactions stored in the database
router.get("/data", verifyToken, async (req, res) => {
  try {
    let { data, error } = await supabase.from("transaction").select();
    if (error) {
      logger.error("", error);
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.info("Data fetched from database..");
    res.status(200).json(data);
  } catch (error) {
    logger.error("", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// to get the most contacted address
router.get("/report", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transaction")
      .select("hash,receiver,date")
      .order("date", { ascending: false })
      .limit(1000);
    if (error) {
      logger.error("", error);
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.info("Data fetched from database..");

    const toAddressCount = data.reduce((count, transaction) => {
      const toAddress = transaction.receiver;
      count[toAddress] = (count[toAddress] || 0) + 1;
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
    const maxAddressTransactions = data.filter(
      (transaction) => transaction.receiver === maxToAddress
    );

    maxAddressTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const reportTransaction = maxAddressTransactions[0];
    if (!reportTransaction) {
      logger.warn("no data found!!!");
      return res.status(400).json({ message: "no data found!!!!" });
    }
    reportTransaction.date = new Date(reportTransaction.date).toLocaleString();
    res.status(200).json({
      max_value_txn_hash: reportTransaction.hash,
      max_txns_with_address: reportTransaction.receiver,
      date_max_txns: reportTransaction.date,
    });
  } catch (error) {
    logger.error("", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
