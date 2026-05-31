import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { createSeedData } from "./seedData";
import type { AppData } from "./types";

const DATA_KEY = "family-nanny-hub:data:v1";
const LOCAL_DATA_PATH = process.env.VERCEL
  ? path.join("/tmp", "nanny-hub.json")
  : path.join(process.cwd(), ".data", "nanny-hub.json");

let redis: Redis | null | undefined;

export async function readAppData(): Promise<AppData> {
  const redisClient = getRedisClient();
  if (redisClient) {
    const saved = await redisClient.get<AppData>(DATA_KEY);
    if (saved) {
      return saved;
    }

    const seed = createSeedData();
    await redisClient.set(DATA_KEY, seed);
    return seed;
  }

  try {
    const file = await fs.readFile(LOCAL_DATA_PATH, "utf8");
    return JSON.parse(file) as AppData;
  } catch {
    const seed = createSeedData();
    await writeLocalData(seed);
    return seed;
  }
}

export async function writeAppData(data: AppData): Promise<AppData> {
  const nextData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const redisClient = getRedisClient();
  if (redisClient) {
    await redisClient.set(DATA_KEY, nextData);
    return nextData;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Persistent storage is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.",
    );
  }

  await writeLocalData(nextData);
  return nextData;
}

function getRedisClient() {
  if (redis !== undefined) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

async function writeLocalData(data: AppData) {
  await fs.mkdir(path.dirname(LOCAL_DATA_PATH), { recursive: true });
  await fs.writeFile(LOCAL_DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}
