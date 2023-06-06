import { authConfig } from "@api/core-domain/infra/auth/config";
import NextAuth from "next-auth/next";

const handler = NextAuth(authConfig);

export default handler;
