const express = require("express");
const authRoute = require("./routes/auth/auth");
const dataApi = require("./routes/data/api");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Listening to ${PORT}`);
});


// to check the health of the server
app.get("/", async (req, res) => {
  res.send("working server!!!");
});

app.use(express.json(), cors());

app.use("/users", authRoute);
app.use("/api", dataApi);
