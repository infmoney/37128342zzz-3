const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const app = express();
require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = JSON.parse(fs.readFileSync("./db.json"));
const WEBHOOK = process.env.DISCORD_WEBHOOK;

const saveDB = () => fs.writeFileSync("./db.json", JSON.stringify(db, null, 2));

const logToDiscord = async (msg, ip) => {
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: `⚠️ Omega Hub Access`,
        description: msg,
        color: 0xff0000,
        footer: { text: ip }
      }],
      components: [{
        type: 1,
        components: [
          { type: 2, style: 4, label: "Blacklist IP", custom_id: `blacklist_${ip}` },
          { type: 2, style: 3, label: "Clear IP", custom_id: `clear_${ip}` }
        ]
      }]
    })
  });
};

app.post("/generate", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const { fingerprint } = req.body;

  if (db.blacklist.includes(ip)) return res.json({ message: "🚫 You are blacklisted." });

  const now = Date.now();
  const existing = db.keys[ip];

  if (existing && now < existing.expires) {
    db.strikes[ip] = (db.strikes[ip] || 0) + 1;
    if (db.strikes[ip] >= 2) {
      db.blacklist.push(ip);
      saveDB();
      logToDiscord(`User ${ip} blacklisted after 2 strikes.`, ip);
      return res.json({ message: "🚫 You were blacklisted after 2 attempts." });
    }
    saveDB();
    return res.json({ message: "⚠️ You already have a key." });
  }

  const key = Math.random().toString(36).substr(2, 10).toUpperCase();
  db.keys[ip] = { key, expires: now + 86400000, fingerprint };
  saveDB();

  logToDiscord(`🆕 Key generated for IP: ${ip}`, ip);
  res.json({ message: `✅ Your Key: ${key}` });
});

app.post("/log-devtools", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  logToDiscord(`DevTools detected for ${ip}`, ip);
  res.sendStatus(200);
});

app.listen(3000, () => console.log("Omega Hub site running on http://localhost:3000"));
