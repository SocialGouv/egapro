import { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";

import type { IOwnershipRequestRepo } from "../repo/IOwnershipRequestRepo";

interface Input {
  askerEmail: string;
  emails: string[];
  sirens: string[];
}

export class CreateOwnershipRequest implements UseCase<Input, void> {
  constructor(private readonly ownershipRequestRepo: IOwnershipRequestRepo) {}

  public async execute({ sirens, emails, askerEmail }: Input): Promise<void> {
    try {
      const validatedAskerEmail = new Email(askerEmail);

      const setSirens = new Set<Siren>();
      const setEmails = new Set<Email>();

      for (const siren of sirens) {
        try {
          const validatedSiren = new Siren(siren);
          setSirens.add(validatedSiren);
        } catch (error) {
          console.error(`Error for Siren ${siren}`, error);
        }
      }

      for (const email of emails) {
        try {
          const validatedEmail = new Email(email);
          setEmails.add(validatedEmail);
        } catch (error) {
          console.error(`Error for email ${email}`);
        }
      }

      // Add in ownership-request all pairs of Siren/email.

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
    } catch (error: unknown) {
      throw new CreateOwnershipRequestError("Cannot create a ownership request", error as Error);
    }
  }
}

export class CreateOwnershipRequestError extends AppError {}
