import { type EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { Percentage } from "@common/shared-domain/domain/valueObjects";

export interface BalancedRepresentationProps {
  executiveMenPercent?: Percentage;
  executiveWomenPercent?: Percentage;
  memberMenPercent?: Percentage;
  memberWomenPercent?: Percentage;
  notComputableReasonExecutives?: string;
  notComputableReasonMembers?: string;
}

export class BalancedRepresentation extends JsonEntity<BalancedRepresentationProps, never> {
  /** `pourcentage_hommes_cadres` */
  get executiveMenPercent(): Percentage | undefined {
    return this.props.executiveMenPercent;
  }
  /** `pourcentage_femmes_cadres` */
  get executiveWomenPercent(): Percentage | undefined {
    return this.props.executiveWomenPercent;
  }
  /** `pourcentage_hommes_membres` */
  get memberMenPercent(): Percentage | undefined {
    return this.props.memberMenPercent;
  }
  /** `pourcentage_femmes_membres` */
  get memberWomenPercent(): Percentage | undefined {
    return this.props.memberWomenPercent;
  }
  /** `motif_non_calculabilité_cadres` */
  get notComputableReasonExecutives(): string | undefined {
    return this.props.notComputableReasonExecutives;
  }
  /** `motif_non_calculabilité_membres` */
  get notComputableReasonMembers(): string | undefined {
    return this.props.notComputableReasonMembers;
  }

  public fromJson(json: EntityPropsToJson<BalancedRepresentationProps>) {
    const props: BalancedRepresentationProps = {
      notComputableReasonExecutives: json.notComputableReasonExecutives,
      notComputableReasonMembers: json.notComputableReasonMembers,
    };
    if (json.executiveMenPercent) props.executiveMenPercent = new Percentage(json.executiveMenPercent);
    if (json.executiveWomenPercent) props.executiveWomenPercent = new Percentage(json.executiveWomenPercent);
    if (json.memberMenPercent) props.memberMenPercent = new Percentage(json.memberMenPercent);
    if (json.memberWomenPercent) props.memberWomenPercent = new Percentage(json.memberWomenPercent);

    return new BalancedRepresentation(props) as this;
  }
}
