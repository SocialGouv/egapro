import { z } from "zod";

export const updateOpMcDTOSchema = z.object({
  objectifIndicateurUn: z.string(),
  objectifIndicateurDeux: z.string(),
  objectifIndicateurTrois: z.string(),
  objectifIndicateurDeuxTrois: z.string(),
  objectifIndicateurQuatre: z.string(),
  objectifIndicateurCinq: z.string(),
  datePublicationObjectifs: z.string(),
  datePublicationMesures: z.string(),
  modalitesPublicationObjectifsMesures: z.string(),
  lienPublication: z.string(),
});

export type UpdateOpMcDTO = z.infer<typeof updateOpMcDTOSchema>;
