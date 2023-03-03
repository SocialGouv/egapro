import { JsonEntity } from "@common/shared-domain";

export interface AbstractIndicatorProps {
  progressObjective?: string;
}

export abstract class AbstractIndicator<P extends AbstractIndicatorProps> extends JsonEntity<P, never> {
  /** `objectif_de_progression` */
  get progressObjective(): string | undefined {
    return this.props.progressObjective;
  }

  public setProgressObjective(progressObjective?: string) {
    this.props.progressObjective = progressObjective;
  }
}
