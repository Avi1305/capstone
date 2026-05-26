import amqplib from "amqplib";

const QUEUE_NAME = "auth_notification_queue";

const connect = await amqplib.connect(process.env.RABBITMQ_URL);

const channel = await connect.createChannel();

await channel.assertQueue(QUEUE_NAME, { durable: true });

export default channel;


