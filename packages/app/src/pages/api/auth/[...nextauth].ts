// pages/api/auth/[...nextauth].ts
import { authConfig } from "@api/core-domain/infra/auth/config";
import NextAuth from "next-auth";

const handler = NextAuth(authConfig);

export default async function nextAuthHandler(req, res) {
  console.log("NextAuth handler called", {
    url: req.url,
    method: req.method,
    query: req.query,
    headers: req.headers,
  });
  return handler(req, res);
}
