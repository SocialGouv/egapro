import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

import { BalancedRepresentation } from "./indicators/BalancedRepresentation";
import { HighRemunerationsIndicator } from "./indicators/HighRemunerationsIndicator";
import { MaternityLeavesIndicator } from "./indicators/MaternityLeavesIndicator";
import { RemunerationsIndicator } from "./indicators/RemunerationsIndicator";
import { SalaryRaisesAndPromotionsIndicator } from "./indicators/SalaryRaisesAndPromotionsIndicator";
import { SalaryRaisesOrPromotionsIndicator } from "./indicators/SalaryRaisesOrPromotionsIndicator";

export interface IndicatorsProps {
  balancedRepresentation?: BalancedRepresentation;
  highRemunerations?: HighRemunerationsIndicator;
  maternityLeaves?: MaternityLeavesIndicator;
  promotions?: SalaryRaisesOrPromotionsIndicator;
  remunerations?: RemunerationsIndicator;
  salaryRaises?: SalaryRaisesOrPromotionsIndicator;
  salaryRaisesAndPromotions?: SalaryRaisesAndPromotionsIndicator;
}

export class Indicators extends JsonEntity<IndicatorsProps, never> {
  /** `rémunérations` - Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes */
  get remunerations(): RemunerationsIndicator | undefined {
    return this.props.remunerations;
  }

  /** `augmentations` - Indicateur 2 relatif à l'écart de taux d'augmentations individuelles (hors promotion) entre les femmes et les hommes */
  get salaryRaises(): SalaryRaisesOrPromotionsIndicator | undefined {
    return this.props.salaryRaises;
  }

  /** Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes */
  get promotions(): SalaryRaisesOrPromotionsIndicator | undefined {
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

  /** `représentation_équilibrée` */
  get balancedRepresentation(): BalancedRepresentation | undefined {
    return this.props.balancedRepresentation;
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

  public getAllIndicatorsWithBalancedRepresentation() {
    return [...this.getAllIndicators(), this.balancedRepresentation] as const;
  }

  public fromJson(json: EntityPropsToJson<IndicatorsProps>) {
    const props: IndicatorsProps = {};

    if (json.remunerations)
      props.remunerations = RemunerationsIndicator.fromJson<RemunerationsIndicator>(json.remunerations);

    if (json.salaryRaises)
      props.salaryRaises = SalaryRaisesOrPromotionsIndicator.fromJson<SalaryRaisesOrPromotionsIndicator>(
        json.salaryRaises,
      );

    if (json.promotions)
      props.promotions = SalaryRaisesOrPromotionsIndicator.fromJson<SalaryRaisesOrPromotionsIndicator>(json.promotions);

    if (json.salaryRaisesAndPromotions)
      props.salaryRaisesAndPromotions = SalaryRaisesAndPromotionsIndicator.fromJson<SalaryRaisesAndPromotionsIndicator>(
        json.salaryRaisesAndPromotions,
      );

    if (json.maternityLeaves)
      props.maternityLeaves = MaternityLeavesIndicator.fromJson<MaternityLeavesIndicator>(json.maternityLeaves);

    if (json.highRemunerations)
      props.highRemunerations = HighRemunerationsIndicator.fromJson<HighRemunerationsIndicator>(json.highRemunerations);

    if (json.balancedRepresentation)
      props.balancedRepresentation = BalancedRepresentation.fromJson<BalancedRepresentation>(
        json.balancedRepresentation,
      );

    return new Indicators(props) as this;
  }
}
