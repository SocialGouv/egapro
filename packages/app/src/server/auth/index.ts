import NextAuth, { getServerSession } from "next-auth";

import { authConfig } from "./config";

const handler = NextAuth(authConfig);

async function auth() {
	try {
		return await getServerSession(authConfig);
	} catch {
		return null;
	}
}

export { auth, handler };
