// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chat");
const deployRoutes = require("./routes/deploy");

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// przekazujemy wszystkie /api/chat i /api/health do chatRoutes
app.use("/api", chatRoutes);

// przekazujemy /api/deployTables do deployRoutes
app.use("/api", deployRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Serwer uruchomiony na http://localhost:${PORT}`);
});
