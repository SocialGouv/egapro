import { rest } from "msw";

const handlers = [
  rest.get("/validate-siren", async (req, res, ctx) => {
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
  rest.post("/ownership", async (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),
];

export { handlers };
