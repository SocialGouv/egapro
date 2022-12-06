import { declarationRepo } from "@api/core-domain/repo";
import {
  GetDeclarationBySirenAndYear,
  GetDeclarationBySirenAndYearError,
} from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import { ValidationError } from "@common/shared-domain";
import type { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).send(null);
  }

  const siren = req.query.siren as string;
  const year = req.query.year as string;

  try {
    const useCase = new GetDeclarationBySirenAndYear(declarationRepo);
    const ret = await useCase.execute({ siren, year });
    if (ret) res.status(200).json(ret);
    else res.status(404);
  } catch (error: unknown) {
    if (error instanceof GetDeclarationBySirenAndYearError) {
      if (error.previousError instanceof ValidationError) {
        return res.status(422).send(error.previousError.message);
      }
      res.status(400).send(error.appErrorList().map(e => e.message));
    } else {
      console.error(error);
      res.status(500).send(null);
    }
  }
};

export default handler;
