import { StatusCodes } from "@api/shared-domain/infra/http/Controller";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type Siret } from "@common/core-domain/domain/valueObjects/Siret";
import { stringify } from "qs";

import {
  type Entreprise,
  type Etablissement,
  type IEntrepriseService,
  type SearchParameters,
} from "../IEntrepriseService";
import { EntrepriseServiceError, EntrepriseServiceNotFoundError } from "../IEntrepriseService";

const RECHERCHE_ENTREPRISE_URL = "https://api.recherche-entreprises.fabrique.social.gouv.fr/api/v1/";

export class RechercheEntrepriseService implements IEntrepriseService {
  public async search(parameters: SearchParameters): Promise<Entreprise[]> {
    // TODO try/catch wrap in decorator
    try {
      const stringifiedParams = stringify(parameters);
      const url = new URL(`search?${stringifiedParams}`, RECHERCHE_ENTREPRISE_URL);

      const response = await fetch(url, {
        headers: {
          Referer: "egapro",
        },
      });

      if (!response.ok) {
        if (response.status === StatusCodes.NOT_FOUND) {
          throw new EntrepriseServiceNotFoundError(`Search led to not found.`);
        }
        throw new EntrepriseServiceError(`Search failed (${stringifiedParams}).`);
      }

      return response.json();
    } catch (error: unknown) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError("Unknown search error.", error as Error);
    }
  }

  public async siren(siren: Siren): Promise<Entreprise> {
    try {
      const validatedSiren = siren.getValue();
      const url = new URL(`entreprise/${validatedSiren}`, RECHERCHE_ENTREPRISE_URL);

      const response = await fetch(url, {
        headers: {
          Referer: "egapro",
        },
      });

      if (!response.ok) {
        if (response.status === StatusCodes.NOT_FOUND) {
          throw new EntrepriseServiceNotFoundError(`Siren not found. (${validatedSiren})`);
        }
        throw new EntrepriseServiceError(`Siren failed (${validatedSiren}).`);
      }

      return response.json();
    } catch (error: unknown) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError("Unknown Siren error.", error as Error);
    }
  }

  public async siret(siret: Siret): Promise<Etablissement> {
    try {
      const validatedSiret = siret.getValue();
      const url = new URL(`etablissement/${validatedSiret}`, RECHERCHE_ENTREPRISE_URL);

      const response = await fetch(url, {
        headers: {
          Referer: "egapro",
        },
      });

      if (!response.ok) {
        if (response.status === StatusCodes.NOT_FOUND) {
          throw new EntrepriseServiceNotFoundError(`Siret not found. (${validatedSiret})`);
        }
        throw new EntrepriseServiceError(`Siret failed (${validatedSiret}).`);
      }

      return response.json();
    } catch (error: unknown) {
      if (error instanceof EntrepriseServiceError) {
        throw error;
      }
      throw new EntrepriseServiceError("Unknown Siret error.", error as Error);
    }
  }
}
