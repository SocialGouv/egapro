import { fetcher } from "./fetcher";

//
export const requestEmailForToken = (email: string, path: string) =>
  fetcher("/token", {
    method: "POST",
    body: JSON.stringify({
      email,
      path,
    }),
  });
