import { fetcher } from "./fetcher";

export const requestEmailForToken = (email: string, redirectTo: string) =>
  fetcher("/token", {
    method: "POST",
    body: JSON.stringify({
      email,
      redirectTo,
    }),
  });
