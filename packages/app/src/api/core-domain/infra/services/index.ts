import { services } from "@common/config";

import type { IEntrepriseService } from "./IEntrepriseService";
import { RechercheEntrepriseService } from "./impl/RechercheEntrepriseService";

export let rechercheEntrepriseService: IEntrepriseService;

if (services.apiEntreprise === "fabrique") {
  rechercheEntrepriseService = new RechercheEntrepriseService();
}
