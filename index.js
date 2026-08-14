require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

/* ================= ENV ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ALERTS_URL = process.env.ALERTS_URL;
const ALERTS_API_TOKEN = process.env.ALERTS_API_TOKEN;

console.log("BOT_TOKEN:", !!BOT_TOKEN);
console.log("API TOKEN:", !!ALERTS_API_TOKEN);

/* ================= BOT ================= */

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

let lastStatus = null;
let lastRaw = null;
let isFirstRun = true;

/* ================= HELPERS ================= */

function buildKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🔴 Відкрити моніторинг загроз",
          url: "https://t.me/xybc_live"
        }
      ]
    ]
  };
}

async function sendMessage(text) {
  try {
    await bot.sendMessage(CHAT_ID, text, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: buildKeyboard()
    });
  } catch (err) {
    console.error("Помилка надсилання повідомлення:", err.message);
  }
}

async function sendRestartLog() {
  console.log("♻️ Бот перезапущено (Render прокинувся)");
}

/* ================= CORE ================= */

async function checkAlerts() {
  try {
    const response = await fetch(ALERTS_URL, {
      headers: {
        Authorization: `Bearer ${ALERTS_API_TOKEN}`,
      },
    });

    const raw = await response.text();
    const clean = raw.replace(/"/g, "");

    if (clean === lastRaw) {
      console.log("Дубльований API статус — пропускаю");
      return;
    }

    lastRaw = clean;

    const status = (clean === "A" || clean === "P") ? "alert" : "clear";
    console.log("Статус зараз:", status);

    if (isFirstRun) {
      isFirstRun = false;
      lastStatus = status;
      await sendRestartLog();
      return;
    }

    if (status !== lastStatus) {
      if (status === "alert") {
        await sendMessage("<b>🚨 ПОВІТРЯНА ТРИВОГА</b>\n\n❗️ ДІЗНАТИСЯ ПРИЧИНУ ТРИВОГИ: @xybc_live");
      } else {
        await sendMessage("<b>🟢 ВІДБІЙ ПОВІТРЯНОЇ ТРИВОГИ</b>\n\n❗️ ДІЗНАТИСЯ ПРИЧИНУ ТРИВОГИ: @xybc_live");
      }

      lastStatus = status;
    }

  } catch (err) {
    console.error("Помилка при запиті API:", err.message);
  }
}

/* ================= START ================= */

checkAlerts();
setInterval(checkAlerts, 25000);

/* ================= EXPRESS ================= */

const app = express();

app.get("/", (req, res) => {
  res.send("Бот працює 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
