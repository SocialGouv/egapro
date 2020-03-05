import btoa = require("btoa");
import fetch, { RequestInit } from "node-fetch";
import { configuration } from "../configuration";
import { logger } from "../util";

const headers = {
  // tslint:disable-next-line: object-literal-key-quotes
  Authorization:
    "Basic " +
    btoa(`${configuration.kintoLogin}:${configuration.kintoPassword}`),
  "Content-Type": "application/json"
};

const bucket = `${configuration.kintoURL}/buckets/${configuration.kintoBucket}`;
const collections = (name: string) => bucket + `/collections/${name}`;
const records = (name: string) => collections(name) + "/records";

const requestOptions = (
  method: "GET" | "POST" | "PUT" | "HEAD",
  body?: any
) => {
  const options: any = {
    headers,
    method
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return options;
};

type CollectionFn = <T>(name: string) => KintoCollection<T>;

const api = async (url: string, options: RequestInit) => {
  logger.info(`[kinto-api] ${url}`);
  const response = await fetch(url, options);
  return response.json();
};

const apiCount = async (url: string, options: RequestInit) => {
  logger.info(`[kinto-api] count for ${url}`);
  const response = await fetch(url, options);
  return response.headers.get("total-objects");
};

export const collection: CollectionFn = <T>(name: string) => ({
  add: (record: T) =>
    api(records(name), requestOptions("POST", { data: record })),
  count: (filter: string) =>
    apiCount(`${records(name)}?${filter}`, requestOptions("HEAD")),
  one: (id: string) => api(`${records(name)}/${id}`, requestOptions("GET")),
  update: (id: string, record: T) =>
    api(`${records(name)}/${id}`, requestOptions("PUT", { data: record }))
});

export interface KintoCollection<T> {
  add: (record: T) => Promise<KintoResult<T>>;
  update: (id: string, record: T) => Promise<KintoResult<T>>;
  one: (id: string) => Promise<KintoResult<T>>;
  count: (filter: string) => Promise<string | null>;
}

export interface KintoResult<T> {
  data: T;
}
