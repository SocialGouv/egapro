import { JsonEntity } from "@common/shared-domain";
import { type PositiveInteger, type PositiveNumber } from "@common/shared-domain/domain/valueObjects";

export interface AbstractIndicatorProps {
  score?: PositiveInteger;
}

export abstract class AbstractIndicator<P extends AbstractIndicatorProps> extends JsonEntity<P, never> {
  get score(): PositiveInteger | undefined {
    return this.props.score;
  }

  public setScore(score: PositiveNumber) {
    this.props.score = score;
  }
}
