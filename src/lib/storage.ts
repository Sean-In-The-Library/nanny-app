import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { createSeedData } from "./seedData";
import type { AppData } from "./types";

const DATA_KEY = "family-nanny-hub:data:v1";
const POSTGRES_TABLE = "family_nanny_hub_storage";
const LOCAL_DATA_PATH = process.env.VERCEL
  ? path.join("/tmp", "nanny-hub.json")
  : path.join(process.cwd(), ".data", "nanny-hub.json");

type SqlClient = NeonQueryFunction<false, false>;

let postgres: SqlClient | null | undefined;
let postgresReady = false;
let redis: Redis | null | undefined;

export async function readAppData(): Promise<AppData> {
  const postgresClient = getPostgresClient();
  if (postgresClient) {
    return readPostgresData(postgresClient);
  }

  const redisClient = getRedisClient();
  if (redisClient) {
    const saved = await redisClient.get<AppData>(DATA_KEY);
    if (saved) {
      return normalizeAppData(saved);
    }

    const seed = createSeedData();
    await redisClient.set(DATA_KEY, seed);
    return seed;
  }

  try {
    const file = await fs.readFile(LOCAL_DATA_PATH, "utf8");
    return normalizeAppData(JSON.parse(file) as Partial<AppData>);
  } catch {
    const seed = createSeedData();
    await writeLocalData(seed);
    return seed;
  }
}

export async function writeAppData(data: AppData): Promise<AppData> {
  const nextData = {
    ...normalizeAppData(data),
    updatedAt: new Date().toISOString(),
  };

  const postgresClient = getPostgresClient();
  if (postgresClient) {
    await writePostgresData(postgresClient, nextData);
    return nextData;
  }

  const redisClient = getRedisClient();
  if (redisClient) {
    await redisClient.set(DATA_KEY, nextData);
    return nextData;
  }

  await writeLocalData(nextData);
  return nextData;
}

function getPostgresClient() {
  if (postgres !== undefined) {
    return postgres;
  }

  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  postgres = databaseUrl ? neon(databaseUrl) : null;
  return postgres;
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

async function readPostgresData(sql: SqlClient): Promise<AppData> {
  await ensurePostgresStorage(sql);

  const rows = (await sql.query(
    `SELECT data FROM ${POSTGRES_TABLE} WHERE key = $1 LIMIT 1`,
    [DATA_KEY],
  )) as Array<{ data: unknown }>;

  if (rows[0]?.data) {
    return parseStoredData(rows[0].data);
  }

  const seed = createSeedData();
  await writePostgresData(sql, seed);
  return seed;
}

async function writePostgresData(sql: SqlClient, data: AppData) {
  await ensurePostgresStorage(sql);
  await sql.query(
    `INSERT INTO ${POSTGRES_TABLE} (key, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [DATA_KEY, JSON.stringify(data)],
  );
}

async function ensurePostgresStorage(sql: SqlClient) {
  if (postgresReady) {
    return;
  }

  await sql.query(
    `CREATE TABLE IF NOT EXISTS ${POSTGRES_TABLE} (
      key text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  postgresReady = true;
}

function parseStoredData(value: unknown): AppData {
  if (typeof value === "string") {
    return normalizeAppData(JSON.parse(value) as Partial<AppData>);
  }

  return normalizeAppData(value as Partial<AppData>);
}

function normalizeAppData(data: Partial<AppData>): AppData {
  const seed = createSeedData();

  return {
    notes: Array.isArray(data.notes) ? data.notes : seed.notes,
    chores: Array.isArray(data.chores) ? data.chores : seed.chores,
    careManuals: Array.isArray(data.careManuals)
      ? data.careManuals
      : seed.careManuals,
    supplies: Array.isArray(data.supplies) ? data.supplies : seed.supplies,
    trackers: Array.isArray(data.trackers) ? data.trackers : seed.trackers,
    developmentGoals: Array.isArray(data.developmentGoals)
      ? data.developmentGoals
      : seed.developmentGoals,
    calendarEvents: Array.isArray(data.calendarEvents)
      ? data.calendarEvents
      : seed.calendarEvents,
    medicationEntries: Array.isArray(data.medicationEntries)
      ? data.medicationEntries
      : seed.medicationEntries,
    milestones: Array.isArray(data.milestones) ? data.milestones : seed.milestones,
    adminItems: Array.isArray(data.adminItems) ? data.adminItems : seed.adminItems,
    // Day log fields arrived after launch: stored data without them is real
    // production data, not a fresh database, so fall back to empty arrays
    // instead of seed values.
    logEvents: Array.isArray(data.logEvents) ? data.logEvents : [],
    dayDigests: Array.isArray(data.dayDigests) ? data.dayDigests : [],
    updatedAt: data.updatedAt ?? seed.updatedAt,
  };
}

async function writeLocalData(data: AppData) {
  await fs.mkdir(path.dirname(LOCAL_DATA_PATH), { recursive: true });
  await fs.writeFile(LOCAL_DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}
