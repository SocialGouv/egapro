import { ownershipRequestRepo } from "@api/core-domain/repo";
import { CreateOwnershipRequest, CreateOwnershipRequestError } from "@api/core-domain/useCases/CreateOwnershipRequest";
import { ValidationError } from "@common/shared-domain";
import type { NextApiHandler } from "next";

// TODO: switch later to controller class
const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).send(null);
  }

  const { sirens, emails, askerEmail } = req.body;

  try {
    const useCase = new CreateOwnershipRequest(ownershipRequestRepo);
    await useCase.execute({ sirens, emails, askerEmail });
    res.status(200).json({});
  } catch (error: unknown) {
    if (error instanceof CreateOwnershipRequestError) {
      if (error.previousError instanceof ValidationError) {
        return res.status(422).json({ errorMessage: error.previousError.message });
      }
      res.status(400).json({
        errorMessage: error
          .appErrorList()
          .map(e => e.message)
          .join(" | "),
      });
    } else {
      console.error(error);
      res.status(500).send(null);
    }
  }
};

export default handler;
