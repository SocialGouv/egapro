import { services } from "@common/config";

import type { IEntrepriseService } from "./IEntrepriseService";
import { RechercheEntrepriseService } from "./impl/RechercheEntrepriseService";

export let entrepriseService: IEntrepriseService;

if (services.apiEntreprise === "fabrique") {
  entrepriseService = new RechercheEntrepriseService();
}
