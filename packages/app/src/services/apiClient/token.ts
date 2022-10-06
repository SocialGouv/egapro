import { fetcher } from "@common/utils/fetcher";

export const requestEmailForToken = (email: string) =>
  fetcher("/token", {
    method: "POST",
    body: JSON.stringify({
      email,
      url: `${window.location.href}?token=`,
    }),
  });
