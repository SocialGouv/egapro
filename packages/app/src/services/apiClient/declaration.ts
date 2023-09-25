import { type DeclarationDTO } from "@common/models/generated";
import { getSession, useSession } from "next-auth/react";
import useSWR from "swr";

import { fetcher, type FetcherOptions, type FetcherReturn, genericErrorMessage } from "./fetcher";

/** @deprecated */

export type DeclarationAPI = {
  data: DeclarationDTO;
  declared_at: number;
  modified_at: number;
  siren: string;
  year: number;
};

export const submitDeclaration = async (dto: DeclarationDTO) => {
  const session = await getSession();

  const siren = dto.entreprise.siren;
  const year = dto.déclaration.année_indicateurs;
  const url = `/declaration/${siren}/${year}`;

  console.log({ dto });

  return fetcher(url, {
    headers: {
      "API-KEY": session?.user.tokenApiV1,
    } as HeadersInit,
    method: "PUT",
    body: JSON.stringify(dto),
  });
};

export const fetchDeclaration = (siren: string, year: number, options?: FetcherOptions) =>
  fetcher(`/declaration/${siren}/${year}`, options) as Promise<DeclarationAPI>;

// export const useRepresentationEquilibree = (siren: string, year: number) => {
//   const { isAuthenticated } = useUser();
//   const { data: repeq, error } = useSWR<RepresentationEquilibreeAPI>(
//     !siren || !year || !isAuthenticated ? null : `/representation-equilibree/${siren}/${year}`,
//   );

//   const loading = !siren || !year || !isAuthenticated ? false : !repeq && !error ? true : false;

//   return { repeq, error, loading };
// };

// export const fetchRepresentationEquilibreeAsFormState = async (siren: string, year: number) => {
//   try {
//     const repeq = await fetchRepresentationEquilibree(siren, year);
//     return buildFormState(repeq.data);
//   } catch (error) {
//     if (error instanceof ApiError && error.statusCode === 404) {
//       // We can safely ignore this error, because this is the normal case.
//       return undefined;
//     } else {
//       throw error;
//     }
//   }
// };

export function useDeclaration(siren?: string, year?: number): FetcherReturn & { declaration?: DeclarationAPI } {
  const normalizedSiren = siren && siren.length === 9 ? siren : undefined;

  const session = useSession();

  const tokenApiV1 = session.data?.user?.tokenApiV1;

  const { data, error, mutate } = useSWR<DeclarationAPI>(
    normalizedSiren && year ? `/declaration/${normalizedSiren}/${year}` : null,
    url =>
      fetcher(url, {
        headers: {
          "API-KEY": tokenApiV1,
        } as HeadersInit,
      }),
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Never retry on 404.
        if (error.status === 404) return;

        // Never retry on 403 (Forbidden).
        if (error.status === 403) return;

        // Never retry on 422 (Unprocessable Entity). SIREN seen invalid by our API.
        if (error.status === 422) return;

        // Only retry up to 3 times.
        if (retryCount >= 3) return;

        // Retry after 5 seconds.
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    },
  );

  const isLoading = !data && !error;
  const isError = Boolean(error);

  return {
    declaration: data,
    error,
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  };
}

export function useDeclarations(siren: string): FetcherReturn & { declarations: Record<string, DeclarationAPI> } {
  const normalizedSiren = siren && siren.length === 9 ? siren : undefined;

  const { data, error, mutate } = useSWR<DeclarationAPI[]>(
    normalizedSiren ? `/declarations/${normalizedSiren}?limit=-1` : null,
    fetcher,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Never retry on 404.
        if (error.status === 404) return;

        // Never retry on 403 (Forbidden).
        if (error.status === 403) return;

        // Never retry on 422 (Unprocessable Entity). SIREN seen invalid by our API.
        if (error.status === 422) return;

        // Only retry up to 3 times.
        if (retryCount >= 3) return;

        // Retry after 5 seconds.
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    },
  );

  const isLoading = !data && !error;
  const isError = Boolean(error);

  const dataWithoutDrafts = data?.filter(declaration => Boolean(declaration.declared_at));

  const declarations = !dataWithoutDrafts
    ? {}
    : dataWithoutDrafts.reduce((acc, declaration) => ({ ...acc, [String(declaration.year)]: declaration }), {});

  return {
    declarations,
    error,
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  };
}

export const resendReceipt = async (siren: string, year: number) => {
  const session = await getSession();

  return fetcher(`/declaration/${siren}/${year}/receipt`, {
    headers: {
      "API-KEY": session?.user.tokenApiV1,
    } as HeadersInit,
    method: "POST",
  });
};
