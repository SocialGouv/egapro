// pages/api/auth/[...nextauth].ts
import { authConfig } from "@api/core-domain/infra/auth/config";
import NextAuth from "next-auth";

export default NextAuth(authConfig);
