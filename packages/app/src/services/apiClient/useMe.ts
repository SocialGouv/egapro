import useSWR from "swr";

import { fetcher } from "./fetcher";

// TODO: type à confirmer par rapport au endpoint /!\
type DeclarationSummary = {
  declared_at: number | null;
  modified_at: number;
  name: string | null;
  siren: string;
  year: number;
};

type TokenInfoType = {
  déclarations: DeclarationSummary[];
  email: string;
  ownership: string[];
  staff: boolean;
};

export const useMe = (token: string | undefined) => {
  const { data: user, error } = useSWR<TokenInfoType>(!token ? null : "/me", fetcher);

  return { user, error };
};
