import { ownershipRequestRepo } from "@api/core-domain/repo";
import { CreateOwnershipRequest, CreateOwnershipRequestError } from "@api/core-domain/useCases/CreateOwnershipRequest";
import { GetOwnershipRequest, GetOwnershipRequestError } from "@api/core-domain/useCases/GetOwnershipRequest";
import { ValidationError } from "@common/shared-domain";
import { normalizeQueryParam } from "@common/utils/url";
import type { NextApiHandler } from "next";

// TODO: switch later to controller class
const handler: NextApiHandler = async (req, res) => {
  if (!["PUT", "GET"].includes(req.method || "")) {
    return res.status(405).send(null);
  }

  switch (req.method) {
    case "PUT":
      return put(req, res);
    case "GET":
      return get(req, res);
  }
};

const put: NextApiHandler = async (req, res) => {
  const { sirens, emails, askerEmail } = req.body;

  try {
    const useCase = new CreateOwnershipRequest(ownershipRequestRepo);
    const warnings = await useCase.execute({ sirens, emails, askerEmail });
    res.status(200).json({ warnings: warnings.map(warning => [warning.errorCode, warning.errorMessage]) });
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

// TODO: Ajouter le décorateur Staff only
const get: NextApiHandler = async (req, res) => {
  const {
    siren: sirenQuery,
    status: statusQuery,
    limit: limitQuery,
    offset: offsetQuery,
    orderBy: orderByQuery,
    orderAsc: orderAscQuery,
  } = req.query;

  const siren = normalizeQueryParam(sirenQuery);
  const status = normalizeQueryParam(statusQuery);
  const limit = normalizeQueryParam(limitQuery);
  const offset = normalizeQueryParam(offsetQuery);
  const orderBy = normalizeQueryParam(orderByQuery);
  const orderAsc = normalizeQueryParam(orderAscQuery);

  try {
    const useCase = new GetOwnershipRequest(ownershipRequestRepo);
    const ownershipRequests = await useCase.execute({ siren, status, limit, offset, orderBy, orderAsc });
    res.status(200).json(ownershipRequests);
  } catch (error: unknown) {
    if (error instanceof GetOwnershipRequestError) {
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
