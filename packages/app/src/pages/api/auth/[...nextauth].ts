// pages/api/auth/[...nextauth].ts
import { authConfig } from "@api/core-domain/infra/auth/config";
import NextAuth from "next-auth";

const handler = NextAuth(authConfig);

export default async function nextAuthHandler(req, res) {
  return handler(req, res);
}
