"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_1 = __importDefault(require("./routes/data/api"));
const auth_1 = __importDefault(require("./routes/auth/auth"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Listening to ${PORT}`);
});
// to check the health of the server
app.get("/", (req, res) => {
    res.send("working server!!!");
});
app.use(express_1.default.json());
app.use("/users", auth_1.default);
app.use("/api", api_1.default);
