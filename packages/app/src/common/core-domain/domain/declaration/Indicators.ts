import { type EntityPropsToJson, JsonEntity } from "@common/shared-domain";

import { HighRemunerationsIndicator } from "./indicators/HighRemunerationsIndicator";
import { MaternityLeavesIndicator } from "./indicators/MaternityLeavesIndicator";
import { PromotionsIndicator } from "./indicators/PromotionsIndicator";
import { RemunerationsIndicator } from "./indicators/RemunerationsIndicator";
import { SalaryRaisesAndPromotionsIndicator } from "./indicators/SalaryRaisesAndPromotionsIndicator";
import { SalaryRaisesIndicator } from "./indicators/SalaryRaisesIndicator";

export interface IndicatorsProps {
  highRemunerations?: HighRemunerationsIndicator;
  maternityLeaves?: MaternityLeavesIndicator;
  promotions?: PromotionsIndicator;
  remunerations?: RemunerationsIndicator;
  salaryRaises?: SalaryRaisesIndicator;
  salaryRaisesAndPromotions?: SalaryRaisesAndPromotionsIndicator;
}

export class Indicators extends JsonEntity<IndicatorsProps, never> {
  /** `rémunérations` - Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes */
  get remunerations(): RemunerationsIndicator | undefined {
    return this.props.remunerations;
  }

  /** `augmentations` - Indicateur 2 relatif à l'écart de taux d'augmentations individuelles (hors promotion) entre les femmes et les hommes */
  get salaryRaises(): SalaryRaisesIndicator | undefined {
    return this.props.salaryRaises;
  }

  /** Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes */
  get promotions(): PromotionsIndicator | undefined {
    return this.props.promotions;
  }

  /** Indicateur 2et3 relatif à l'écart de taux d'augmentations individuelles entre les femmes et les homme pour les entreprises de 250 salariés ou moins */
  get salaryRaisesAndPromotions(): SalaryRaisesAndPromotionsIndicator | undefined {
    return this.props.salaryRaisesAndPromotions;
  }

  /** `congés_maternité` - Indicateur 4 relatif au pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé de maternité */
  get maternityLeaves(): MaternityLeavesIndicator | undefined {
    return this.props.maternityLeaves;
  }

  /** `hautes_rémunérations` - Indicateur 5 relatif au nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations */
  get highRemunerations(): HighRemunerationsIndicator | undefined {
    return this.props.highRemunerations;
  }

  public getAllIndicators() {
    return [
      this.remunerations,
      this.salaryRaises,
      this.salaryRaisesAndPromotions,
      this.maternityLeaves,
      this.highRemunerations,
    ] as const;
  }

  public fromJson(json: EntityPropsToJson<IndicatorsProps>) {
    const props: IndicatorsProps = {};

    if (json.remunerations) props.remunerations = RemunerationsIndicator.fromJson(json.remunerations);

    if (json.salaryRaises) props.salaryRaises = SalaryRaisesIndicator.fromJson(json.salaryRaises);

    if (json.promotions) props.promotions = PromotionsIndicator.fromJson(json.promotions);

    if (json.salaryRaisesAndPromotions)
      props.salaryRaisesAndPromotions = SalaryRaisesAndPromotionsIndicator.fromJson(json.salaryRaisesAndPromotions);

    if (json.maternityLeaves) props.maternityLeaves = MaternityLeavesIndicator.fromJson(json.maternityLeaves);

    if (json.highRemunerations) props.highRemunerations = HighRemunerationsIndicator.fromJson(json.highRemunerations);

    return new Indicators(props) as this;
  }
}
