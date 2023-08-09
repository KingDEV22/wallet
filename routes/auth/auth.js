const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("@hapi/joi");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const winston = require("winston");

dotenv.config();

const supabaseUrl = "https://vautcfpbwbjpqtwyzmfe.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey,{auth: { persistSession: false },});

const { createLogger, format, transports } = winston;
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({})],
  exceptionHandlers: [new transports.Console({})],
  rejectionHandlers: [new transports.Console({})],
});

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

// Use router.post instead of Router.post
router.post("/register", async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      logger.error("", error);
      return res.status(400).json({ error: error.details[0].message });
    }
    logger.info("Request Data validated");
    let { data:email, error: emailError } = await supabase
      .from("user_details")
      .select("email");
    if (emailError) {
      logger.error("", emailError);
      return res.status(400).json({ error: emailError.details[0].message });
    }
    if (email) {
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
      return res.status(400).json({ error: dataError.details[0].message });
    }
    logger.info("user saved in database");
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    logger.error("", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { error } = await loginSchema.validateAsync(req.body);
    if (error) {
      logger.error("", error);
      return res.status(400).json({ error: error.details[0].message });
    } else {
      let { data: user, error: emailError } = await supabase
        .from("user_details")
        .select()
        .eq("email", req.body.email);
      if (emailError) {
        logger.error("", emailError);
        return res.status(400).json({ error: emailError.details[0].message });
      }
      if (!user) {
        logger.warn("user not found!!!!");
        return res.status(400).end("Email not found!!!");
      }
      const validPassword = await bcrypt.compare(
        req.body.password,
        user[0].password
      );
      if (!validPassword) {
        logger.warn("Incorrect Password!!!");
        return res.status(400).end("Incorrect Password!!!");
      }
      const token = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET);
      logger.info("token generated");
      res.status(200).json({ auth: token });
    }
  } catch (error) {
    logger.error("", error);
    res.status(500).send(error);
  }
});

module.exports = router;
