import { authConfig } from "@api/core-domain/infra/auth/config";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";

import { type Any } from "./types";

export const getServerActionSession = () => {
  const req = {
    headers: Object.fromEntries(headers()),
    cookies: Object.fromEntries(
      cookies()
        .getAll()
        .map(c => [c.name, c.value]),
    ),
  } as Any;
  const res = {
    getHeader() {
      /* */
    },
    setCookie() {
      /* */
    },
    setHeader() {
      /* */
    },
  } as Any;
  return getServerSession(req, res, authConfig);
};
