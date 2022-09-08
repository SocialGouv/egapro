import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { CorrectiveMeasures } from "../valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { DeclarationIndex } from "../valueObjects/declaration/declarationInfo/DeclarationIndex";
import { IndicatorsYear } from "../valueObjects/declaration/declarationInfo/IndicatorsYear";
import { Publication } from "./declarationInfo/Publication";

export interface DeclarationInfoProps {
  computablePoints: PositiveNumber;
  correctiveMeasures: CorrectiveMeasures;
  date: Date;
  draft: boolean;
  endReferencePeriod: Date;
  index?: DeclarationIndex;
  indicatorsYear: IndicatorsYear;
  points: PositiveNumber;
  publication: Publication;
  sufficientPeriod: boolean;
}

export class DeclarationInfo extends JsonEntity<DeclarationInfoProps, never> {
  /** `points_calculables` - Nombre total de points pouvant être obtenus */
  get computablePoints(): PositiveNumber {
    return this.props.computablePoints;
  }

  /** `mesures_correctives` - Mesures de corrections prévues à l'article D. 1142-6 / Trois items : Mesures mises en œuvre (mmo), Mesures envisagées (me), Mesures non envisagées (mne) */
  get correctiveMeasures(): CorrectiveMeasures {
    return this.props.correctiveMeasures;
  }

  /** Date de validation et de transmission des résultats au service Egapro */
  get date(): Date {
    return this.props.date;
  }

  /** `brouillon` - Une déclaration en brouillon ne sera pas considérée par les services de la DGT et les validations croisées globales ne seront pas effectuées */
  get draft(): boolean {
    return this.props.draft;
  }

  /** `fin_période_référence` - Date de fin de la période de référence considérée pour le calcul des indicateurs */
  get endReferencePeriod(): Date {
    return this.props.endReferencePeriod;
  }

  /** Résultat final sur 100 points */
  get index(): DeclarationIndex | undefined {
    return this.props.index;
  }

  /** `année_indicateurs` - Peut être absent en cas de vieilles données */
  get indicatorsYear(): IndicatorsYear {
    return this.props.indicatorsYear;
  }

  /** Nombre total de points obtenus */
  get points(): PositiveNumber {
    return this.props.points;
  }

  get publication(): Publication {
    return this.props.publication;
  }

  /** `période_suffisante` - Vaut false si l'entreprise à moins de 12 mois d'existence sur la période de calcul considérée */
  get sufficientPeriod(): boolean {
    return this.props.sufficientPeriod;
  }

  public fromJson(json: EntityPropsToJson<DeclarationInfoProps>) {
    const props: DeclarationInfoProps = {
      computablePoints: new PositiveNumber(json.computablePoints),
      correctiveMeasures: new CorrectiveMeasures(json.correctiveMeasures),
      date: new Date(json.date),
      draft: json.draft,
      endReferencePeriod: new Date(json.endReferencePeriod),
      indicatorsYear: new IndicatorsYear(json.indicatorsYear),
      points: new PositiveNumber(json.points),
      publication: Publication.fromJson(json.publication),
      sufficientPeriod: json.sufficientPeriod,
    };

    // TODO: activate if old datas needs it
    // if (json.indicatorsYear) {
    //   props.indicatorsYear = new IndicatorsYear(json.indicatorsYear);
    // }

    if (json.index) {
      props.index = new DeclarationIndex(json.index);
    }

    return new DeclarationInfo(props) as this;
  }
}
