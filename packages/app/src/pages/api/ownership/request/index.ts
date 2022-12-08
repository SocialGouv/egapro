import { ownershipRequestRepo } from "@api/core-domain/repo";
import { CreateOwnershipRequest, CreateOwnershipRequestError } from "@api/core-domain/useCases/CreateOwnershipRequest";
import { ValidationError } from "@common/shared-domain";
import type { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).send(null);
  }

  const body = req.body;

  // Check payload for Sirens and emails and asker's email and returns a 400 Bad Request if any.

  const { sirens, emails, askerEmail } = body;

  for (const siren of sirens) {
    for (const email of emails) {
      console.log(`Demande Siren ${siren} - email ${email} (demandeur ${askerEmail})`);
    }
  }

  //   return res.status(200).send(null);

  try {
    const useCase = new CreateOwnershipRequest(ownershipRequestRepo);
    const ret = await useCase.execute({ sirens, emails, askerEmail });

    res.status(200).json(ret);
  } catch (error: unknown) {
    if (error instanceof CreateOwnershipRequestError) {
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
