import { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type { ErrorDetailTuple } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { ErrorDetail } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { OwnershipRequestWarningsDTO } from "@common/core-domain/dtos/OwnershipRequestWarningDTO";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { ValidationError } from "@common/shared-domain/domain";
import { Email } from "@common/shared-domain/domain/valueObjects";

import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

interface Input {
  askerEmail: string;
  emails: string[];
  sirens: string[];
}

const buildErrorMessage = (error: unknown, label: string, value: string) => {
  let message = `Error for ${label} ${value}`;

  if (error instanceof Error) {
    message = `${message} | ${error.message}`;
  }
  console.error(message);
  return message;
};

export class CreateOwnershipRequest implements UseCase<Input, OwnershipRequestWarningsDTO> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({ sirens, emails, askerEmail }: Input): Promise<OwnershipRequestWarningsDTO> {
    try {
      if (!Array.isArray(sirens) || !Array.isArray(emails)) {
        throw new ValidationError("Error for sirens or emails. Array is expected.");
      }

      const validatedAskerEmail = new Email(askerEmail);

      // Store as a tuple : first element is the validated one, if any. The second element is the original one, if validation failed.
      const setOfSirens = new Set<[Siren?, ErrorDetail?]>();
      const setOfEmails = new Set<[Email?, ErrorDetail?]>();

      const warnings: ErrorDetail[] = [];

      for (const siren of sirens) {
        try {
          const validatedSiren = new Siren(siren);
          setOfSirens.add([validatedSiren, undefined]);
        } catch (error: unknown) {
          const errorDetail = new ErrorDetail(["INVALID_SIREN", buildErrorMessage(error, "Siren", siren)]);
          warnings.push(errorDetail);
          setOfSirens.add([undefined, errorDetail]);
        }
      }

      for (const email of emails) {
        try {
          const validatedEmail = new Email(email);
          setOfEmails.add([validatedEmail, undefined]);
        } catch (error: unknown) {
          const errorDetail = new ErrorDetail(["INVALID_EMAIL", buildErrorMessage(error, "email", email)]);
          warnings.push(errorDetail);
          setOfEmails.add([undefined, errorDetail]);
        }
      }

      const statusOK = new OwnershipRequestStatus(OwnershipRequestStatus.Enum.TO_PROCESS);
      const statusError = new OwnershipRequestStatus(OwnershipRequestStatus.Enum.ERROR);

      // Add all pairs of Siren/email in ownership-request.
      for (const siren of setOfSirens) {
        for (const email of setOfEmails) {
          const ownershipRequest = new OwnershipRequest({
            siren: siren[0],
            email: email[0],
            askerEmail: validatedAskerEmail,
            status: siren[1] ?? email[1] ? statusError : statusOK,
            errorDetail: siren[1] ?? email[1],
          });

          await this.ownershipRequestRepo.save(ownershipRequest);
        }
      }
      return { warnings: warnings.map<ErrorDetailTuple>(warning => [warning.errorCode, warning.errorMessage]) };
    } catch (error: unknown) {
      throw new CreateOwnershipRequestError("Cannot create an ownership request", error as Error);
    }
  }
}

export class CreateOwnershipRequestError extends AppError {}
