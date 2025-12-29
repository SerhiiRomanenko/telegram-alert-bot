require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");
const path = require("path");

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

/* ================= MEDIA ================= */


const ALERT_MEDIA = [
  { type: "video", file: "alert1.mp4" },
  { type: "video", file: "alert2.mp4" },
  { type: "video", file: "alert3.mp4" },
  { type: "video", file: "alert4.mp4" },
  { type: "photo", file: "alert5.jpg" },
  { type: "photo", file: "alert6.jpg" },
  { type: "video", file: "alert7.mp4" },
  { type: "video", file: "alert8.mp4" },
  { type: "video", file: "alert9.mp4" },
  { type: "video", file: "alert10.mp4" }
];


const CLEAR_MEDIA = [
  { type: "photo", file: "cancel1.jpg" },
  { type: "photo", file: "cancel2.jpg" },
  { type: "photo", file: "cancel3.jpg" },
  { type: "photo", file: "cancel4.jpg" },
  { type: "photo", file: "cancel5.jpg" },
  { type: "photo", file: "cancel6.jpg" },
  { type: "video", file: "cancel7.mp4" }

];

/* ================= HELPERS ================= */

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMessage(baseText) {
  return `<b>${baseText}</b>\n\n` +
    `✅ <a href="https://t.me/huyova_bila_tserkva">Хуйова Біла Церква</a> | ` +
    `<a href="https://t.me/xy_dmin">Прислати новину</a>`;
}

function getFileStream(fileName) {
  return fs.createReadStream(
    path.join(__dirname, "images", fileName)
  );
}

async function sendMediaMessage(media, caption) {
  const options = {
    caption,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  try {
    const fileStream = getFileStream(media.file);

    if (media.type === "photo") {
      await bot.sendPhoto(CHAT_ID, fileStream, options);
    }

    if (media.type === "animation") {
      await bot.sendAnimation(CHAT_ID, fileStream, options);
    }

    if (media.type === "video") {
      await bot.sendVideo(CHAT_ID, fileStream, options);
    }
  } catch (err) {
    console.error("Помилка надсилання медіа:", err.message);
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
        const media = randomItem(ALERT_MEDIA);
        await sendMediaMessage(
          media,
          buildMessage("🚨 В БЦ районі повітряна тривога — ПЕРЕШЛИ БЛИЗЬКИМ!")
        );
      } else {
        const media = randomItem(CLEAR_MEDIA);
        await sendMediaMessage(
          media,
          buildMessage("🟢 Відбій! \n — МОЖНА ЄБЛУВАТИ ДАЛІ")
        );
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