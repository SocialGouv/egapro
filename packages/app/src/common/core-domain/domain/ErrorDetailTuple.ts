import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

const errorDetailCodes = ["EMAIL_DELIVERY_KO", "INVALID_EMAIL", "INVALID_SIREN"] as const;

export type ErrorDetailCode = typeof errorDetailCodes[number];
type ErrorDetailTupleProps = [ErrorDetailCode, string];

// TODO @pom why this is an entity and not a value object instead?
export class ErrorDetailTuple extends JsonEntity<ErrorDetailTupleProps> {
  get errorCode(): ErrorDetailCode {
    return this.props[0];
  }

  get errorMessage(): string {
    return this.props[1];
  }

  public fromJson(json: EntityPropsToJson<ErrorDetailTupleProps>) {
    const props: ErrorDetailTupleProps = [json[0], json[1]];

    return new ErrorDetailTuple(props) as typeof this;
  }
}
