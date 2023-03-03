import { z } from "zod";

export const updateOpMcDTOSchema = z.object({
  objectifIndicateurUn: z.string().optional(),
  objectifIndicateurDeux: z.string().optional(),
  objectifIndicateurTrois: z.string().optional(),
  objectifIndicateurDeuxTrois: z.string().optional(),
  objectifIndicateurQuatre: z.string().optional(),
  objectifIndicateurCinq: z.string().optional(),
  datePublicationObjectifs: z.string(),
  datePublicationMesures: z.string(),
  modalitesPublicationObjectifsMesures: z.string(),
  lienPublication: z.string().optional(),
});

export type UpdateOpMcDTO = z.infer<typeof updateOpMcDTOSchema>;
