import { TupleString } from "@common/shared-domain/domain/valueObjects";

export const errorDetailCodes = [
  "EMAIL_DELIVERY_KO",
  "INVALID_EMAIL",
  "INVALID_SIREN",
  "ALREADY_PROCESSED",
  "NOT_FOUND_SIREN",
] as const;

export const errorDetailLabel: Record<(typeof errorDetailCodes)[number], string> = {
  EMAIL_DELIVERY_KO: "L'envoi du mail a échoué",
  ALREADY_PROCESSED: "La demande a déjà été traitée",
  INVALID_EMAIL: "L'email est invalide",
  INVALID_SIREN: "Le SIREN est invalide",
  NOT_FOUND_SIREN: "Le SIREN n'existe pas",
};

export type ErrorDetailCode = (typeof errorDetailCodes)[number];
export type ErrorDetailTuple = [ErrorDetailCode, string];

export class ErrorDetail extends TupleString<typeof errorDetailCodes> {
  constructor(private readonly tuple: ErrorDetailTuple) {
    super(tuple[0], errorDetailCodes);
  }

  get errorCode(): ErrorDetailCode {
    return this.tuple[0];
  }

  get errorMessage(): string {
    return this.tuple[1];
  }

  public toString() {
    return this.errorCode + ":" + this.errorMessage;
  }
}
