import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

import { HighRemunerationsIndicator } from "./indicators/HighRemunerationsIndicator";
import { MaternityLeavesIndicator } from "./indicators/MaternityLeavesIndicator";
import { RemunerationsIndicator } from "./indicators/RemunerationsIndicator";
import { SalaryRaisesAndPromotionsIndicator } from "./indicators/SalaryRaisesAndPromotionsIndicator";
import { SalaryRaisesOrPromotionsIndicator } from "./indicators/SalaryRaisesOrPromotionsIndicator";

export interface IndicatorsProps {
  highRemunerations: HighRemunerationsIndicator;
  maternityLeaves: MaternityLeavesIndicator;
  promotions: SalaryRaisesOrPromotionsIndicator;
  remunerations: RemunerationsIndicator;
  salaryRaises: SalaryRaisesOrPromotionsIndicator;
  salaryRaisesAndPromotions: SalaryRaisesAndPromotionsIndicator;
}

export class Indicators extends JsonEntity<IndicatorsProps, never> {
  /** `rémunérations` - Indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes */
  get remunerations(): RemunerationsIndicator {
    return this.props.remunerations;
  }

  /** `augmentations` - Indicateur 2 relatif à l'écart de taux d'augmentations individuelles (hors promotion) entre les femmes et les hommes */
  get salaryRaises(): SalaryRaisesOrPromotionsIndicator {
    return this.props.salaryRaises;
  }

  /** Indicateur 3 relatif à l'écart de taux de promotions entre les femmes et les hommes */
  get promotions(): SalaryRaisesOrPromotionsIndicator {
    return this.props.promotions;
  }

  /** Indicateur 2et3 relatif à l'écart de taux d'augmentations individuelles entre les femmes et les homme pour les entreprises de 250 salariés ou moins */
  get salaryRaisesAndPromotions(): SalaryRaisesAndPromotionsIndicator {
    return this.props.salaryRaisesAndPromotions;
  }

  /** `congés_maternité` - Indicateur 4 relatif au pourcentage de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé de maternité */
  get maternityLeaves(): MaternityLeavesIndicator {
    return this.props.maternityLeaves;
  }

  /** `hautes_rémunérations` - Indicateur 5 relatif au nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunérations */
  get highRemunerations(): HighRemunerationsIndicator {
    return this.props.highRemunerations;
  }

  public fromJson(json: EntityPropsToJson<IndicatorsProps>) {
    return new Indicators({
      remunerations: RemunerationsIndicator.fromJson(json.remunerations),
      salaryRaises: SalaryRaisesOrPromotionsIndicator.fromJson(json.salaryRaises),
      promotions: SalaryRaisesOrPromotionsIndicator.fromJson(json.promotions),
      salaryRaisesAndPromotions: SalaryRaisesAndPromotionsIndicator.fromJson(json.salaryRaisesAndPromotions),
      maternityLeaves: MaternityLeavesIndicator.fromJson(json.maternityLeaves),
      highRemunerations: HighRemunerationsIndicator.fromJson(json.highRemunerations),
    }) as this;
  }
}
