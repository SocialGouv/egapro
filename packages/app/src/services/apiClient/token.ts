import { fetcher } from "@services/apiClient/fetcher";

export const requestEmailForToken = (email: string, url: string) =>
  fetcher("/token", {
    method: "POST",
    body: JSON.stringify({
      email,
      url,
    }),
  });
