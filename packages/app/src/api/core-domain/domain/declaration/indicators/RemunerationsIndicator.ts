import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { Percentage, PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";
import { RemunerationsMode } from "../../valueObjects/declaration/indicators/RemunerationsMode";

type Categorie = {
  name: string;
  ranges: {
    "30:39": Percentage;
    "40:49": Percentage;
    "50:": Percentage;
    ":29": Percentage;
  };
};

export interface RemunerationsIndicatorProps {
  categories: Categorie[];
  cseConsultationDate: Date;
  favorablePopulation: FavorablePopulation;
  mode: RemunerationsMode;
  notComputableReason?: NotComputableReason;
  progressObjective?: string;
  result: Percentage;
  score: PositiveInteger;
}

export class RemunerationsIndicator extends JsonEntity<RemunerationsIndicatorProps, never> {
  /** `catégories` */
  get categories(): Categorie[] {
    return [...this.props.categories];
  }

  /** `date_consultation_cse` - Uniquement pour les modalités de calcul par niveau ou coefficient hiérarchique en application de la classification de branche ou d'une autre méthode de cotation des postes */
  get cseConsultationDate(): Date {
    return this.props.cseConsultationDate;
  }

  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation {
    return this.props.favorablePopulation;
  }

  get mode(): RemunerationsMode {
    return this.props.mode;
  }

  /** `non_calculable` - Vide ou egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total */
  get notComputableReason(): NotComputableReason | undefined {
    return this.props.notComputableReason;
  }

  /** `objectif_de_progression` */
  get progressObjective(): string | undefined {
    return this.props.progressObjective;
  }

  /** `résultat` - Résultat final en % après application du seuil de pertinence à chaque catégorie */
  get result(): Percentage {
    return this.props.result;
  }

  /** `note` - Nombre de points obtenus à l'indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes */
  get score(): PositiveInteger {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<RemunerationsIndicatorProps>) {
    const props: RemunerationsIndicatorProps = {
      mode: new RemunerationsMode(json.mode),
      result: new Percentage(json.result),
      score: new PositiveInteger(json.score),
      favorablePopulation: new FavorablePopulation(json.favorablePopulation),
      cseConsultationDate: new Date(json.cseConsultationDate),
      progressObjective: json.progressObjective,
      categories: json.categories.map(({ name, ranges }) => ({
        name,
        ranges: {
          "30:39": new Percentage(ranges["30:39"]),
          "40:49": new Percentage(ranges["40:49"]),
          "50:": new Percentage(ranges["50:"]),
          ":29": new Percentage(ranges[":29"]),
        },
      })),
    };
    if (json.notComputableReason) {
      props.notComputableReason = new NotComputableReason(json.notComputableReason);
    }

    return new RemunerationsIndicator(props) as this;
  }
}
