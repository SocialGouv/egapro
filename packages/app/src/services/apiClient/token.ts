import { fetcher } from "./fetcher";

//
export const requestEmailForToken = (email: string, target: string) =>
  fetcher("/token", {
    method: "POST",
    body: JSON.stringify({
      email,
      target,
    }),
  });
