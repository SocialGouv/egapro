import { type EntityPropsToJson } from "@common/shared-domain";
import { Percentage, PositiveInteger, SimpleNumber } from "@common/shared-domain/domain/valueObjects";

import { type AgeRange } from "../../valueObjects/declaration/AgeRange";
import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReasonRemunerations } from "../../valueObjects/declaration/indicators/NotComputableReasonRemunerations";
import { RemunerationsMode } from "../../valueObjects/declaration/indicators/RemunerationsMode";
import { type AbstractIndicatorProps } from "./AbstractIndicator";
import { AbstractIndicator } from "./AbstractIndicator";

export type Categorie = {
  name?: string;
  ranges?: Partial<Record<AgeRange.Enum, SimpleNumber>>;
};

export interface RemunerationsIndicatorProps extends AbstractIndicatorProps {
  categories: Categorie[];
  cseConsultationDate?: Date;
  favorablePopulation?: FavorablePopulation;
  mode?: RemunerationsMode;
  notComputableReason?: NotComputableReasonRemunerations;
  result?: Percentage;
  score?: PositiveInteger;
}

export class RemunerationsIndicator extends AbstractIndicator<RemunerationsIndicatorProps> {
  /** `catégories` */
  get categories(): Categorie[] {
    return [...this.props.categories];
  }

  /** `date_consultation_cse` - Uniquement pour les modalités de calcul par niveau ou coefficient hiérarchique en application de la classification de branche ou d'une autre méthode de cotation des postes */
  get cseConsultationDate(): Date | undefined {
    return this.props.cseConsultationDate;
  }

  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation | undefined {
    return this.props.favorablePopulation;
  }

  get mode(): RemunerationsMode | undefined {
    return this.props.mode;
  }

  /** `non_calculable` - Vide ou egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total */
  get notComputableReason(): NotComputableReasonRemunerations | undefined {
    return this.props.notComputableReason;
  }

  /** `résultat` - Résultat final en % après application du seuil de pertinence à chaque catégorie */
  get result(): Percentage | undefined {
    return this.props.result;
  }

  /** `note` - Nombre de points obtenus à l'indicateur 1 relatif à l'écart de rémunération entre les femmes et les hommes */
  get score(): PositiveInteger | undefined {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<RemunerationsIndicatorProps>) {
    const props: RemunerationsIndicatorProps = {
      progressObjective: json.progressObjective,
      categories: json.categories.map(({ name, ranges }) => ({
        name,
        ranges: {
          "30:39": typeof ranges?.["30:39"] === "number" ? new SimpleNumber(ranges["30:39"]) : void 0,
          "40:49": typeof ranges?.["40:49"] === "number" ? new SimpleNumber(ranges["40:49"]) : void 0,
          "50:": typeof ranges?.["50:"] === "number" ? new SimpleNumber(ranges["50:"]) : void 0,
          ":29": typeof ranges?.[":29"] === "number" ? new SimpleNumber(ranges[":29"]) : void 0,
        },
      })),
    };
    if (json.mode) props.mode = new RemunerationsMode(json.mode);
    if (json.favorablePopulation) props.favorablePopulation = new FavorablePopulation(json.favorablePopulation);
    if (json.cseConsultationDate) props.cseConsultationDate = new Date(json.cseConsultationDate);
    if (json.notComputableReason)
      props.notComputableReason = new NotComputableReasonRemunerations(json.notComputableReason);

    if (typeof json.result === "number") props.result = new Percentage(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);

    return new RemunerationsIndicator(props) as this;
  }
}
