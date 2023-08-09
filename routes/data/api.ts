import { Request, Response, Router } from "express";

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../database.types";
import getTransfer from "../../util/transactions";
import { PostgrestError } from "@supabase/supabase-js";
import { createLogger, format, transports } from "winston";
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }>
  ? Exclude<U, null>
  : never;
export type DbResultErr = PostgrestError;

//logger initialise
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({})],
  exceptionHandlers: [new transports.Console({})],
  rejectionHandlers: [new transports.Console({})],
});

//database config
const supabase = createClient<Database>(
  "https://vautcfpbwbjpqtwyzmfe.supabase.co",
  process.env.SUPABASE_KEY
);

logger.info("Database connected!!");

const router = Router();

// middleware to authenticate endpoints
const verifyToken = async (req: Request, res: Response, next: () => any) => {
  const token = req.headers["auth"];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  const query = supabase.from("tokens").select().eq("token", token);
  const user: DbResult<typeof query> = await query;
  if (user.error !== null) {
    logger.error("error", user.error);
    return res.status(400).send("Invalid token");
  }
  if (user.data?.length === 0) {
    logger.warn("token invalid!!!!");
    return res.status(400).send("token invalid");
  }

  return next();
};

// to add the transaction data of respective ethereum wallet address
router
  .route("/data")
  .post(verifyToken, async (_req: Request, res: Response) => {
    try {
      const data = await getTransfer();
      logger.info("Transaction data fetched..");
      if (data == null) {
        logger.warn("No data found!!!");
        return res.status(400).send("no data found!!!");
      }
      logger.info("Data filtered..");
      const transformedData = data.transfers.map((transaction: any) => {
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

      const { error } = await supabase
        .from("transaction")
        .insert(transformedData);
      if (error) {
        logger.error("", error);
        return res.status(400).json({ error: error });
      }
      res.status(201).json({ message: "created data", data: transformedData });
    } catch (error) {
      logger.error("", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// to get the most contacted address
router
  .route("/report")
  .get(verifyToken, async (_req: Request, res: Response) => {
    const query = supabase
      .from("transaction")
      .select("hash,receiver,date")
      .order("date", { ascending: false })
      .limit(1000);
    const transactions: DbResult<typeof query> = await query;
    if (transactions.error) {
      logger.error("", transactions.error);
      return res.status(400).json({ error: transactions.error });
    }
    const data = transactions.data;
    const toAddressCount: Record<string, number> = data.reduce(
      (count, transaction) => {
        const toAddress = transaction.receiver;
        if (toAddress !== null) {
          count[toAddress] = (count[toAddress] || 0) + 1;
        }
        return count;
      },
      {} as Record<string, number>
    );

    let maxToAddress: string | null = null;
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

    maxAddressTransactions.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : null;
      const dateB = b.date ? new Date(b.date) : null;

      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      } else if (!dateA && dateB) {
        return 1;
      } else if (dateA && !dateB) {
        return -1;
      } else {
        return 0;
      }
    });

    const reportTransaction = maxAddressTransactions[0];
    if (!reportTransaction) {
      logger.warn("no data found!!!");
      return res.status(400).json({ message: "no data found!!!!" });
    }
    if (reportTransaction.date) {
      reportTransaction.date = new Date(
        reportTransaction.date
      ).toLocaleString();
    } else {
      reportTransaction.date = "N/A";
    }
    logger.info("Report generated...");
    res.status(200).json({
      max_value_txn_hash: reportTransaction.hash,
      max_txns_with_address: reportTransaction.receiver,
      date_max_txns: reportTransaction.date,
    });
  });

export default router;
