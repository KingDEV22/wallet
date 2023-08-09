import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { Database } from "../../database.types";
import { PostgrestError } from "@supabase/supabase-js";
import { createLogger, format, transports } from "winston";

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }>
  ? Exclude<U, null>
  : never;
export type DbResultErr = PostgrestError;

// database config
const supabase = createClient<Database>(
  "https://vautcfpbwbjpqtwyzmfe.supabase.co",
  process.env.SUPABASE_KEY,
  {auth: { persistSession: false },}

);

//logger initialize
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({})],
  exceptionHandlers: [new transports.Console({})],
  rejectionHandlers: [new transports.Console({})],
});

const router = Router();

// header data validator
const registerSchema = Joi.object({
  fname: Joi.string().min(3).required(),
  lname: Joi.string().min(3).required(),
  email: Joi.string().min(8).required(),
  password: Joi.string().min(8).required(),
});
const loginSchema = Joi.object({
  email: Joi.string().min(8).required(),
  password: Joi.string().min(8).required(),
});

// to register user to database
router.route("/register").post(async (req: Request, res: Response) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      logger.error("", error);
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.info("Request Data validated");
    const query = supabase
      .from("user_details")
      .select()
      .eq("email", req.body.email);
    const user: DbResult<typeof query> = await query;
    if (user.error !== null) {
      logger.error("error", user.error);
      return res.status(400).json({ error: user.error });
    }
    if (user.data?.length !== 0) {
      logger.warn("Email already exists!!!!");
      return res
        .status(400)
        .json({ error: "Email already exists. Please try with new one" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const { error: dataError } = await supabase.from("user_details").insert([
      {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: hashedPassword,
      },
    ]);

    if (dataError) {
      logger.error("", dataError);
      return res.status(400).json({ error: dataError });
    }
    logger.info("user saved in database");
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    logger.error("", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//to get access token
router.route("/login").post(async (req: Request, res: Response) => {
  try {
    const { error } = await loginSchema.validateAsync(req.body);
    if (error) {
      logger.error("", error);
      return res.status(400).json({ error: error.details[0].message });
    } else {
      const query = supabase
        .from("user_details")
        .select()
        .eq("email", req.body.email);
      const user: DbResult<typeof query> = await query;
      if (user.error !== null) {
        logger.error("error", user.error);
        return res.status(400).json({ error: user.error });
      }
      if (user.data?.length === 0) {
        logger.warn("user not found!!!!");
        return res.status(400).end("Email not found!!!");
      }
      if (user.data[0].password !== null) {
        const validPassword = await bcrypt.compare(
          req.body.password,
          user.data[0].password
        );
        if (!validPassword) {
          logger.warn("Incorrect Password!!!");
          return res.status(400).end("Incorrect Password!!!");
        }
      }
      const salt = await bcrypt.genSalt(10);
      const token = await bcrypt.hash(req.body.email, salt);
      const { error: dataError } = await supabase.from("tokens").insert([
        {
          token: token,
        },
      ]);
      if (dataError) {
        logger.error("", dataError);
        return res.status(400).json({ error: dataError });
      }
      logger.info("token generated");
      res.status(200).json({ auth: token });
    }
  } catch (error) {
    logger.error("", error);
    res.status(500).send(error);
  }
});

export default router;
