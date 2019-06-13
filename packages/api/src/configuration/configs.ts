import { config } from "dotenv";

config();

export const configuration = {
  apiPort: asNumber("API_PORT"),

  kintoBucket: asString("KINTO_BUCKET"),
  kintoLogin: asString("KINTO_LOGIN"),
  kintoPassword: asString("KINTO_PASSWORD"),
  kintoURL: asString("KINTO_URL"),

  mailFrom: asString("MAIL_FROM"),
  mailHost: asString(`MAIL_HOST`),
  mailPassword: asString(`MAIL_PASSWORD`),
  mailPort: asNumber(`MAIL_PORT`),
  mailUseTLS: asBoolean(`MAIL_USE_TLS`),
  mailUsername: asString(`MAIL_USERNAME`)
};

function asString(arg: any): string {
  return getEnvValue(arg);
}

function asNumber(arg: any): number {
  return Number.parseInt(getEnvValue(arg), 10);
}

function asBoolean(arg: any): boolean {
  return "true" === getEnvValue(arg) ? true : false;
}

function getEnvValue(arg: string): string {
  const res = process.env[arg];
  if (!res) {
    throw new Error(`env variable ${arg} is required`);
  }
  return res;
}
