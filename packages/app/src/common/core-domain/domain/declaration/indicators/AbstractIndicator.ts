import { JsonEntity } from "@common/shared-domain";
import { type PositiveInteger, type PositiveNumber } from "@common/shared-domain/domain/valueObjects";

export interface AbstractIndicatorProps {
  progressObjective?: string;
  score?: PositiveInteger;
}

export abstract class AbstractIndicator<P extends AbstractIndicatorProps> extends JsonEntity<P, never> {
  /** `objectif_de_progression` */
  get progressObjective(): string | undefined {
    return this.props.progressObjective;
  }

  public setProgressObjective(progressObjective?: string) {
    this.props.progressObjective = progressObjective;
  }

  get score(): PositiveInteger | undefined {
    return this.props.score;
  }

  public setScore(score: PositiveNumber) {
    this.props.score = score;
  }
}
