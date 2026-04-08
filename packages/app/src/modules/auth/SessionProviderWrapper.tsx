"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Client-side wrapper around NextAuth's `SessionProvider`, needed so the
 * few client components that call `useSession()` / `session.update()` —
 * currently the admin impersonation form and the global impersonate
 * banner — can read and mutate the session without a full page reload.
 */
export function SessionProviderWrapper({ children }: { children: ReactNode }) {
	return <SessionProvider>{children}</SessionProvider>;
}
