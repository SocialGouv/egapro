import NextAuth, { getServerSession } from "next-auth";

import { authConfig } from "./config";

const handler = NextAuth(authConfig);

async function auth() {
	return getServerSession(authConfig);
}

export { auth, handler };
