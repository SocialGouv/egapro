import { fetcher } from "@common/utils/fetcher";

export const requestEmailForToken = (email: string, url: string) =>
  fetcher("/token", {
    method: "POST",
    body: JSON.stringify({
      email,
      url,
    }),
  });
