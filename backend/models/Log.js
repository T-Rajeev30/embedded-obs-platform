const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  deviceName: String,
  level: String,
  message: String,
  uptime: Number,
  isMetric: { type: Boolean, default: false },
  // This 'expires' setting deletes the data automatically after 24 hours
  timestamp: { type: Date, default: Date.now, expires: 86400 },
});

module.exports = mongoose.model("Log", LogSchema);
