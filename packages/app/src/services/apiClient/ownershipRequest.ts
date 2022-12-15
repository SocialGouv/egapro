import type { OwnershipRequestFormType } from "../../pages/ajout-declarant";
import { fetcherV2 } from "./fetcher";

const buildPayload = (formData: OwnershipRequestFormType) => {
  return {
    askerEmail: formData.askerEmail,
    emails: formData.emails.split(","),
    sirens: formData.sirens.split(","),
  };
};

export const putOwnershipRequest = async (formData: OwnershipRequestFormType) => {
  const url = `/ownership/request`;

  //   throw new Error("kaboom");

  return fetcherV2(url, {
    method: "PUT",
    body: JSON.stringify(buildPayload(formData)),
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
