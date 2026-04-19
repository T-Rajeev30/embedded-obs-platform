require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { WebSocketServer } = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");
const Log = require("./models/Log");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI);

// 2. Hardware Gateway (ESP32 connects here)
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  ws.on("message", async (rawData) => {
    try {
      const data = JSON.parse(rawData);

      // Stream live to Dashboard
      io.emit("new-log", data);

      // Conditional DB Save (Filter out routine INFO)
      if (data.type === "METRIC" || data.lvl === "ERROR") {
        const newLog = new Log({
          sessionId: data.sid,
          deviceName: data.dev,
          level: data.lvl,
          message: data.msg,
          uptime: data.up,
          isMetric: data.type === "METRIC",
        });
        await newLog.save();
      }
    } catch (err) {
      console.error(err);
    }
  });
});

// 3. Dashboard Commands (Next.js talks here)
io.on("connection", (socket) => {
  socket.on("cmd-reset", (deviceName) => {
    console.log(`🚀 Sending Reset Command to: ${deviceName}`);

    // Broadcast the reset command to all connected hardware
    // In a real SaaS, we would filter by deviceName
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // 1 = OPEN
        client.send(JSON.stringify({ cmd: "RESET" }));
      }
    });
  });
});

server.listen(4000, () =>
  console.log("🛡️ BWH Relay Active on Ports 8080 & 4000"),
);
