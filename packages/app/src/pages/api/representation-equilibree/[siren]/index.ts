import { representationEquilibreeRepo } from "@api/core-domain/repo";
import {
  GetRepresentationEquilibreeBySiren,
  GetRepresentationEquilibreeBySirenError,
} from "@api/core-domain/useCases/GetRepresentationEquilibreeBySiren";
import { ValidationError } from "@common/shared-domain";
import type { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).send(null);
  }

  const siren = req.query.siren as string;

  try {
    const useCase = new GetRepresentationEquilibreeBySiren(representationEquilibreeRepo);
    const ret = await useCase.execute({ siren });
    res.status(200).json(ret);
  } catch (error: unknown) {
    if (error instanceof GetRepresentationEquilibreeBySirenError) {
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
