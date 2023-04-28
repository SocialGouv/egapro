import { type SearchConsultationInput } from "@common/core-domain/dtos/helpers/common";
import { stringify } from "querystring";

/**
 * this transform is needed to avoid `"?query=test&query=toto"` becoming `{query: "test,toto"}` type of hack.
 */
export const cleanInput = <T extends SearchConsultationInput>(input: T) => {
  const output: SearchConsultationInput = {};
  const cleaned = new URLSearchParams(stringify(input));
  const q = cleaned.get("q");
  const region = cleaned.get("region");
  const departement = cleaned.get("departement");
  const naf = cleaned.get("naf");

  // clean
  if (q) output.q = q;
  if (region) output.region = region as SearchInput["region"];
  if (departement) output.departement = departement as SearchInput["departement"];
  if (naf) output.naf = naf as SearchInput["naf"];

  return output;
};
