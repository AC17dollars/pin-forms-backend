import { MongoClient } from "mongodb";
import env from "@/utils/env.js";
import { cLogger } from "@/utils/logger.js";

export const client = new MongoClient(env.MONGO_URI);

export const db = client.db(env.DB_NAME);

client.on("connectionReady", () => {
  cLogger.info("🛢️ Connected to the MongoDB instance");
});

client.on("connectionClosed", () => {
  cLogger.info("🛢️ Disconnected from the MongoDB instance");
});

export const connectDB = async () => {
  try {
    cLogger.debug("🛢️ Trying to connect to MongoDB instance");

    await client.connect();

    await db.command({ ping: 1 });
  } catch (error) {
    cLogger.error("🛢️ Failed to connect to MongoDB", error);
    setTimeout(() => {
      connectDB();
    }, 120000);
    throw error;
  }
};

export const disconnectDB = async () => {
  await client.close();
};
