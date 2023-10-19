import { type DeclarationDTO } from "./DeclarationDTO";

/**
 * The shape of the state for declaration form.
 */
export type DeclarationOpmcDTO = DeclarationDTO & {
  opmc?: {
    datePublicationMesures?: string;
    datePublicationObjectifs: string;
    modalitesPublicationObjectifsMesures?: string;
    objectifIndicateurAugmentations?: string;
    objectifIndicateurAugmentationsPromotions?: string;
    objectifIndicateurCongesMaternites?: string;
    objectifIndicateurHautesRemunerations?: string;
    objectifIndicateurPromotions?: string;
    objectifIndicateurRemunerations?: string;
  };
};
