import { TupleString } from "@common/shared-domain/domain/valueObjects";

const errorDetailCodes = ["EMAIL_DELIVERY_KO", "INVALID_EMAIL", "INVALID_SIREN", "ALREADY_PROCESSED"] as const;

export type ErrorDetailCode = typeof errorDetailCodes[number];
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
}
