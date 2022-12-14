import { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
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

type WarningsType = { emails: string[]; sirens: string[] };

export class CreateOwnershipRequest implements UseCase<Input, WarningsType> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({ sirens, emails, askerEmail }: Input): Promise<WarningsType> {
    try {
      if (!Array.isArray(sirens) || !Array.isArray(emails)) {
        throw new ValidationError("Error for sirens or emails. Array is expected.");
      }

      const validatedAskerEmail = new Email(askerEmail);

      const setSirens = new Set<Siren>();
      const setEmails = new Set<Email>();

      const warnings: WarningsType = { sirens: [], emails: [] };

      for (const siren of sirens) {
        try {
          const validatedSiren = new Siren(siren);
          setSirens.add(validatedSiren);
        } catch (error) {
          warnings.sirens.push(buildErrorMessage(error, "Siren", siren));
        }
      }

      for (const email of emails) {
        try {
          const validatedEmail = new Email(email);
          setEmails.add(validatedEmail);
        } catch (error) {
          warnings.emails.push(buildErrorMessage(error, "email", email));
        }
      }

      // Add all pairs of Siren/email in ownership-request.
      for (const siren of setSirens) {
        for (const email of setEmails) {
          const ownershipRequest = new OwnershipRequest({
            siren,
            email,
            askerEmail: validatedAskerEmail,
            status: new OwnershipRequestStatus(OwnershipRequestStatus.Enum.TO_PROCESS),
          });

          await this.ownershipRequestRepo.save(ownershipRequest);
        }
      }
      return warnings;
    } catch (error: unknown) {
      throw new CreateOwnershipRequestError("Cannot create a ownership request", error as Error);
    }
  }
}

export class CreateOwnershipRequestError extends AppError {}
