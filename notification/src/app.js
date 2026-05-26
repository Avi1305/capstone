import express from "express";
import channel from "./mq.js";
import { sendEmail } from "./email.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello from Notification Service");
});

channel.consume("auth_notification_queue", async (msg) => {
  try {
    if (msg !== null) {
      const messageContent = msg.content.toString();
      console.log("Received message from queue:", messageContent);

      const { userId, timestamp, email } = JSON.parse(messageContent);

      const subject = "New Login Notification";
      const text = `A new login was detected for your account at ${timestamp}. If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately.`;
      const html = `<p>A new login was detected for your account at ${timestamp}.</p><p>If this was you, you can safely ignore this email.</p><p>If you did not log in, please secure your account immediately.</p>`;
      // Call the email sending function
      await sendEmail(email, subject, text, html);
      channel.ack(msg);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

app.get("/_status/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/_status/readyz", (req, res) => {
  res.status(200).json({ status: "ready" });
});

export default app;
