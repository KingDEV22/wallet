import express, { Request, Response } from "express";
import approutes from "./routes/data/api";
import authroutes from "./routes/auth/auth";
const app = express();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Listening to ${PORT}`);
});

// to check the health of the server
app.get("/", (req: Request, res: Response) => {
  res.send("working server!!!");
});

app.use(express.json());
app.use("/users", authroutes);
app.use("/api", approutes);
