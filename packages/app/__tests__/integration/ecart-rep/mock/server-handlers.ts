import { rest } from "msw";
import { FAKE_SIREN, NOT_LINKED_SIREN, VALID_SIREN } from "./user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const handlers = [
  rest.get(API_URL + "/validate-siren", async (req, res, ctx) => {
    const { searchParams } = req.url;
    if (searchParams.has("siren") && searchParams.get("siren") === FAKE_SIREN) {
      return res(ctx.status(422), ctx.json({ error: "Num\u00e9ro SIREN invalide: " + FAKE_SIREN }));
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
  rest.get(API_URL + "/ownership/" + VALID_SIREN, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ owners: [] }));
  }),
  rest.get(API_URL + "/ownership/" + NOT_LINKED_SIREN, async (req, res, ctx) => {
    return res(
      ctx.status(403),
      ctx.json({ error: "Vous n'avez pas les droits n\u00e9cessaires pour le siren " + NOT_LINKED_SIREN }),
    );
  }),
];

export { handlers };
