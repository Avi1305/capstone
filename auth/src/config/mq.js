import amqplib from "amqplib";

const QUEUE_NAME = "auth_notification_queue";

const connect = await amqplib.connect(process.env.RABBITMQ_URL);

const channel = await connect.createChannel();

await channel.assertQueue(QUEUE_NAME, { durable: true });

export async function sendAuthNotification(message) {
  try {
    await channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );
    console.log("Message sent to queue:", message);
  } catch (error) {
    console.error("Error sending message to queue:", error);
  }
}


