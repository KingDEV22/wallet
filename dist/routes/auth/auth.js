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
const bcrypt_1 = __importDefault(require("bcrypt"));
const joi_1 = __importDefault(require("joi"));
const supabase_js_1 = require("@supabase/supabase-js");
require("dotenv/config");
const winston_1 = require("winston");
// database config
const supabase = (0, supabase_js_1.createClient)("https://vautcfpbwbjpqtwyzmfe.supabase.co", process.env.SUPABASE_KEY, { auth: { persistSession: false }, });
//logger initialize
const logger = (0, winston_1.createLogger)({
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [new winston_1.transports.Console({})],
    exceptionHandlers: [new winston_1.transports.Console({})],
    rejectionHandlers: [new winston_1.transports.Console({})],
});
const router = (0, express_1.Router)();
// header data validator
const registerSchema = joi_1.default.object({
    fname: joi_1.default.string().min(3).required(),
    lname: joi_1.default.string().min(3).required(),
    email: joi_1.default.string().min(8).required(),
    password: joi_1.default.string().min(8).required(),
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().min(8).required(),
    password: joi_1.default.string().min(8).required(),
});
// to register user to database
router.route("/register").post((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const user = yield query;
        if (user.error !== null) {
            logger.error("error", user.error);
            return res.status(400).json({ error: user.error });
        }
        if (((_a = user.data) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
            logger.warn("Email already exists!!!!");
            return res
                .status(400)
                .json({ error: "Email already exists. Please try with new one" });
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(req.body.password, salt);
        const { error: dataError } = yield supabase.from("user_details").insert([
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
    }
    catch (error) {
        logger.error("", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
//to get access token
router.route("/login").post((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { error } = yield loginSchema.validateAsync(req.body);
        if (error) {
            logger.error("", error);
            return res.status(400).json({ error: error.details[0].message });
        }
        else {
            const query = supabase
                .from("user_details")
                .select()
                .eq("email", req.body.email);
            const user = yield query;
            if (user.error !== null) {
                logger.error("error", user.error);
                return res.status(400).json({ error: user.error });
            }
            if (((_b = user.data) === null || _b === void 0 ? void 0 : _b.length) === 0) {
                logger.warn("user not found!!!!");
                return res.status(400).end("Email not found!!!");
            }
            if (user.data[0].password !== null) {
                const validPassword = yield bcrypt_1.default.compare(req.body.password, user.data[0].password);
                if (!validPassword) {
                    logger.warn("Incorrect Password!!!");
                    return res.status(400).end("Incorrect Password!!!");
                }
            }
            const salt = yield bcrypt_1.default.genSalt(10);
            const token = yield bcrypt_1.default.hash(req.body.email, salt);
            const { error: dataError } = yield supabase.from("tokens").insert([
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
    }
    catch (error) {
        logger.error("", error);
        res.status(500).send(error);
    }
}));
exports.default = router;
