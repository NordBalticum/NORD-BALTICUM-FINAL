// runSendTests.js – Paleidžia SendContext.test.js ir siunčia el. laišką ADMIN_EMAIL

import { exec } from "child_process";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const EMAIL_PASS = process.env.EMAIL_PASS; // app password from Gmail or SMTP provider
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!ADMIN_EMAIL || !EMAIL_PASS || !EMAIL_FROM) {
  console.error("❌ ADMIN_EMAIL / EMAIL_PASS / EMAIL_FROM nėra .env faile");
  process.exit(1);
}

console.log("🚀 Paleidžiami testai...");

exec("vitest run tests/SendContext.test.js", async (err, stdout, stderr) => {
  const output = stdout + "\n\n" + stderr;
  const passed = !err && !stderr.includes("FAIL");

  const subject = passed
    ? "✅ Visi SendContext testai praėjo!"
    : "❌ Klaidų SendContext testuose";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_FROM,
      pass: EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Nord Balticum Bot" <${EMAIL_FROM}>`,
    to: ADMIN_EMAIL,
    subject,
    text: output,
  });

  console.log("📧 Pranešimas išsiųstas:", subject);
  if (err) process.exit(1);
});
