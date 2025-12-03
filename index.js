require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

// ==== ENV ====
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ALERTS_URL = process.env.ALERTS_URL;
const ALERTS_API_TOKEN = process.env.ALERTS_API_TOKEN;

console.log("BOT_TOKEN:", !!BOT_TOKEN);
console.log("API TOKEN:", !!ALERTS_API_TOKEN);

const bot = new TelegramBot(BOT_TOKEN, { polling: false });
let lastStatus = null;

function buildMessage(baseText) {
  return `<b>${baseText}</b>\n\n✅ <a href="https://t.me/huyova_bila_tserkva">Хуйова Біла Церква</a> | <a href="https://t.me/xy_bts">Прислати новину</a>`;
}

async function sendMessage(msg) {
  try {
    await bot.sendMessage(CHAT_ID, msg, { 
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error("Помилка надсилання повідомлення:", error.message);
  }
}

async function checkAlerts() {
  try {
    const response = await fetch(ALERTS_URL, {
      headers: { Authorization: `Bearer ${ALERTS_API_TOKEN}` },
    });

    const raw = await response.text();
    const data = raw.replace(/"/g, "");

    console.log("DATA:", data);

    let status = "clear";
    if (data === "A" || data === "P") status = "alert";

    console.log("Статус зараз:", status);

    if (status !== lastStatus) {
      if (status === "alert") {
        await sendMessage(buildMessage("🚨 ТРИВОГА, ХОВАЙСЬ!"));
      } else {
        await sendMessage(buildMessage("🟢 ВІДБІЙ! — можна курити"));
      }

      lastStatus = status;
    }
  } catch (err) {
    console.error("Помилка при запиті API:", err.message);
  }
}

checkAlerts();
setInterval(checkAlerts, 25000);

const app = express();

app.get("/", (req, res) => {
  res.send("Бот працює 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));
