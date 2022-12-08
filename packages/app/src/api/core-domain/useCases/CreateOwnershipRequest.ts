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
          console.error(`Error for Siren ${siren}`);
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
          await this.ownershipRequestRepo.save({
            siren,
            email,
            askerEmail: validatedAskerEmail,
            status: "À traiter",
          });
        }
      }
    } catch (error: unknown) {
      throw new CreateOwnershipRequestError("Cannot create a ownership request", error as Error);
    }
  }
}

export class CreateOwnershipRequestError extends AppError {}
