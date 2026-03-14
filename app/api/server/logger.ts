import pino from "pino";

export const logger = pino({
  name: "mclucy-api",
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "development" ? "debug" : "info"),
  base: undefined,
  redact: {
    paths: ["authorization", "req.headers.authorization", "headers.authorization"],
    remove: true,
  },
});