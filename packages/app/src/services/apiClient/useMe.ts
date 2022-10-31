import useSWR from "swr";

// TODO: type à confirmer par rapport au endpoint /!\
type DeclarationSummary = {
  declared_at: number | null;
  modified_at: number;
  name: string | null;
  siren: string;
  year: number;
};

export type TokenInfoType = {
  déclarations: DeclarationSummary[];
  email: string;
  ownership: string[];
  staff: boolean;
};

export const useMe = (token: string | undefined) => {
  const { data: user, error, isValidating: loading } = useSWR<TokenInfoType>(!token ? null : "/me");

  return { user, error, loading };
};
