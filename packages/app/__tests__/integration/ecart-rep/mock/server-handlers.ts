import { rest } from "msw";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const INVALID_SIREN = "123456789";
export const NOT_LINKED_SIREN = "504920166";
export const VALID_SIREN = "905292694";

const handlers = [
  rest.get(API_URL + "/validate-siren", async (req, res, ctx) => {
    const { searchParams } = req.url;
    if (searchParams.has("siren") && searchParams.get("siren") === INVALID_SIREN) {
      return res(ctx.json({ error: "Num\u00e9ro SIREN invalide: " + INVALID_SIREN }));
    }
    const enterprise = {
      adresse: "",
      code_naf: "",
      code_pays: "",
      code_postal: "",
      commune: "",
      département: "",
      raison_sociale: "",
      région: "",
      siren: "",
    };
    return res(ctx.json(enterprise));
  }),
  rest.get(API_URL + "/ownership/" + NOT_LINKED_SIREN, async (req, res, ctx) => {
    return res(ctx.json({ error: "Vous n'avez pas les droits n\u00e9cessaires pour le siren " + NOT_LINKED_SIREN }));
  }),
  rest.get(API_URL + "/ownership" + VALID_SIREN, async (req, res, ctx) => {
    return res(ctx.json({ owners: ["test@test.com"] }));
  }),
];

export { handlers };
