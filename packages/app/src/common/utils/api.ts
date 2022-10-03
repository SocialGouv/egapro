import { fetcher } from "../../hooks/utils";

export const requestEmailForToken = (email: string) =>
  fetcher("/token", {
    method: "POST",
    body: JSON.stringify({
      email,
      url: `${window.location.href}?token=`,
    }),
  });
