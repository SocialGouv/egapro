import { type EntityPropsToJson, JsonAggregateRoot } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { Company } from "./declaration/Company";
import { Declarant } from "./declaration/Declarant";
import { Publication } from "./declaration/declarationInfo/Publication";
import { HighRemunerationsIndicator } from "./declaration/indicators/HighRemunerationsIndicator";
import { MaternityLeavesIndicator } from "./declaration/indicators/MaternityLeavesIndicator";
import { PromotionsIndicator } from "./declaration/indicators/PromotionsIndicator";
import { RemunerationsIndicator } from "./declaration/indicators/RemunerationsIndicator";
import { SalaryRaisesAndPromotionsIndicator } from "./declaration/indicators/SalaryRaisesAndPromotionsIndicator";
import { SalaryRaisesIndicator } from "./declaration/indicators/SalaryRaisesIndicator";
import { CorrectiveMeasures } from "./valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { DeclarationIndex } from "./valueObjects/declaration/declarationInfo/DeclarationIndex";
import { DeclarationIndicatorsYear } from "./valueObjects/declaration/declarationInfo/DeclarationIndicatorsYear";
import { DeclarationSource } from "./valueObjects/declaration/DeclarationSource";
import { Siren } from "./valueObjects/Siren";

/* eslint-disable typescript-sort-keys/interface */
export interface DeclarationProps {
  siren: Siren;
  year: DeclarationIndicatorsYear;
  declaredAt: Date;
  modifiedAt: Date;
  declarant: Declarant;
  company: Company;
  index?: DeclarationIndex;
  points?: PositiveNumber;
  computablePoints?: PositiveNumber;
  endReferencePeriod?: Date;
  sufficientPeriod: boolean;
  source: DeclarationSource;
  publication?: Publication;
  correctiveMeasures?: CorrectiveMeasures;

  // Indicators.
  // Indicator 1.
  remunerations?: RemunerationsIndicator;
  // Indicator 2.
  salaryRaises?: SalaryRaisesIndicator;
  // Indicator 3.
  promotions?: PromotionsIndicator;
  // Indicator 2&3.
  salaryRaisesAndPromotions?: SalaryRaisesAndPromotionsIndicator;
  // Indicator 4.
  maternityLeaves?: MaternityLeavesIndicator;
  // Indicator 5.
  highRemunerations?: HighRemunerationsIndicator;
}

/* eslint-enable typescript-sort-keys/interface */

export type DeclarationPK = [Siren, PositiveNumber];

export class Declaration extends JsonAggregateRoot<DeclarationProps, DeclarationPK> {
  get siren(): Siren {
    return this.props.siren;
  }

  get year(): DeclarationIndicatorsYear {
    return this.props.year;
  }

  get declaredAt(): Date {
    return this.props.declaredAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  public setModifiedAt(modifiedAt: Date) {
    this.props.modifiedAt = new Date(modifiedAt);
  }

  get declarant(): Declarant {
    return this.props.declarant;
  }

  get company(): Company {
    return this.props.company;
  }

  get index(): DeclarationIndex | undefined {
    return this.props.index;
  }

  get points(): PositiveNumber | undefined {
    return this.props.points;
  }

  get computablePoints(): PositiveNumber | undefined {
    return this.props.computablePoints;
  }

  get endReferencePeriod(): Date | undefined {
    return this.props.endReferencePeriod;
  }

  get sufficientPeriod(): boolean {
    return this.props.sufficientPeriod;
  }

  get source(): DeclarationSource {
    return this.props.source;
  }

  get publication(): Publication | undefined {
    return this.props.publication;
  }

  get correctiveMeasures(): CorrectiveMeasures | undefined {
    return this.props.correctiveMeasures;
  }

  get remunerations(): RemunerationsIndicator | undefined {
    return this.props.remunerations;
  }

  get salaryRaises(): SalaryRaisesIndicator | undefined {
    return this.props.salaryRaises;
  }

  get salaryRaisesAndPromotions(): SalaryRaisesAndPromotionsIndicator | undefined {
    return this.props.salaryRaisesAndPromotions;
  }

  get promotions(): PromotionsIndicator | undefined {
    return this.props.promotions;
  }

  get maternityLeaves(): MaternityLeavesIndicator | undefined {
    return this.props.maternityLeaves;
  }

  get highRemunerations(): HighRemunerationsIndicator | undefined {
    return this.props.highRemunerations;
  }

  public fromJson(json: Partial<EntityPropsToJson<DeclarationProps>>) {
    const props = (this ?? {}) as DeclarationProps;

    if (typeof json.siren !== "undefined") {
      props.siren = new Siren(json.siren);
    }

    if (typeof json.year !== "undefined") {
      props.year = new DeclarationIndicatorsYear(json.year);
    }

    if (typeof json.declaredAt !== "undefined") {
      props.declaredAt = new Date(json.declaredAt);
    }

    if (typeof json.modifiedAt !== "undefined") {
      props.modifiedAt = new Date(json.modifiedAt);
    }

    if (typeof json.declarant !== "undefined") {
      props.declarant = Declarant.fromJson(json.declarant);
    }

    if (typeof json.company !== "undefined") {
      props.company = Company.fromJson(json.company);
    }

    if (typeof json.index !== "undefined") {
      props.index = new DeclarationIndex(json.index);
    }

    if (typeof json.points !== "undefined") {
      props.points = new PositiveNumber(json.points);
    }

    if (typeof json.computablePoints !== "undefined") {
      props.computablePoints = new PositiveNumber(json.computablePoints);
    }

    if (typeof json.endReferencePeriod !== "undefined") {
      props.endReferencePeriod = new Date(json.endReferencePeriod);
    }

    if (typeof json.sufficientPeriod !== "undefined") {
      props.sufficientPeriod = json.sufficientPeriod;
    }

    if (typeof json.source !== "undefined") {
      props.source = new DeclarationSource(json.source);
    }

    if (typeof json.publication !== "undefined") {
      props.publication = Publication.fromJson(json.publication);
    }

    if (typeof json.correctiveMeasures !== "undefined") {
      props.correctiveMeasures = new CorrectiveMeasures(json.correctiveMeasures);
    }

    if (typeof json.remunerations !== "undefined") {
      props.remunerations = RemunerationsIndicator.fromJson(json.remunerations);
    }

    if (typeof json.salaryRaises !== "undefined") {
      props.salaryRaises = SalaryRaisesIndicator.fromJson(json.salaryRaises);
    }

    if (typeof json.salaryRaisesAndPromotions !== "undefined") {
      props.salaryRaisesAndPromotions = SalaryRaisesAndPromotionsIndicator.fromJson(json.salaryRaisesAndPromotions);
    }

    if (typeof json.promotions !== "undefined") {
      props.promotions = PromotionsIndicator.fromJson(json.promotions);
    }

    if (typeof json.maternityLeaves !== "undefined") {
      props.maternityLeaves = MaternityLeavesIndicator.fromJson(json.maternityLeaves);
    }

    if (typeof json.highRemunerations !== "undefined") {
      props.highRemunerations = HighRemunerationsIndicator.fromJson(json.highRemunerations);
    }

    return new Declaration(props) as this;
  }
}
