import { config } from "@common/config";
import postgres from "postgres";

const DEV_CONFIG = {
  host: "localhost",
  port: 5438,
  database: "egapro",
  username: "postgres",
  password: "postgres",
  max: 10,
  ssl: false,
  connect_timeout: 15,
  debug: true,
};

const finalConfig =
  process.env.NODE_ENV === "development"
    ? DEV_CONFIG
    : {
        host: config.api?.postgres?.host || "localhost",
        port: parseInt((config.api?.postgres?.port || 5432) as any),
        database: config.api?.postgres?.db || "egapro",
        username: config.api?.postgres?.user || "postgres",
        password: config.api?.postgres?.password || "postgres",
        max: (config.api?.postgres?.poolMaxSize as number) || 10,
        ssl: !!config.api?.postgres?.ssl,
        connect_timeout: 15,
        debug: true,
      };

export const sql = postgres(finalConfig);
