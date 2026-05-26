import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("Connected to Redis Successfully!");
});

redis.on("error", (err) => {
  console.error("Error connecting to Redis:", err);
});

export async function refreshTTL(sandboxId) {
  const key = `sandbox:${sandboxId}`;
  await redis.expire(key, 60 * 20);
}
