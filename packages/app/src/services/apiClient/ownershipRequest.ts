import type { CreateOwnershipRequestDTO } from "@common/core-domain/dtos/CreateOwnershipRequestDTO";

import { fetcherV2 } from "./fetcher";

export const putOwnershipRequest = async (formData: CreateOwnershipRequestDTO) => {
  const url = `/ownership/request`;

  //   throw new Error("kaboom");

  return fetcherV2(url, {
    method: "PUT",
    body: JSON.stringify(formData),
  });
};

// export const fetchAllOwnershiprequests = (filters: any) =>
//   fetcher(`/representation-equilibree/${siren}/${year}`) as Promise<RepresentationEquilibreeAPI>;

// export const fetchRepresentationEquilibreeSendEmail = (siren: string, year: number) =>
//   fetcher(`/representation-equilibree/${siren}/${year}/receipt`, { method: "POST" });

// export const useAllOwnershipRequests = (siren: string, year: number) => {
//   const { isAuthenticated } = useUser();
//   const { data: repeq, error } = useSWR<RepresentationEquilibreeAPI>(
//     !siren || !year || !isAuthenticated ? null : `/representation-equilibree/${siren}/${year}`,
//   );

//   const loading = !siren || !year || !isAuthenticated ? false : !repeq && !error ? true : false;

//   return { repeq, error, loading };
// };
