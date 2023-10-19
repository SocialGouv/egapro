import { type EntityPropsToJson, JsonAggregateRoot } from "@common/shared-domain";
import { type PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { NonEmptyString } from "@common/shared-domain/domain/valueObjects/NonEmptyString";

import { Declaration } from "./Declaration";
import { type Siren } from "./valueObjects/Siren";

/* eslint-disable typescript-sort-keys/interface */
export interface DeclarationOpmcProps {
  declaration: Declaration;

  measuresPublishDate?: Date;
  objectivesPublishDate?: Date;
  objectivesMeasuresModalities?: NonEmptyString;
  objectiveRemunerations?: NonEmptyString;
  objectiveSalaryRaise?: NonEmptyString;
  objectivePromotions?: NonEmptyString;
  objectiveSalaryRaiseAndPromotions?: NonEmptyString;
  objectiveMaternityLeaves?: NonEmptyString;
  objectiveHighRemunerations?: NonEmptyString;
}
/* eslint-enable typescript-sort-keys/interface */

export type DeclarationPK = [Siren, PositiveNumber];

/**
 * Aggregate of a declaration and its OP/MC data.
 *
 * Use Declaration if you don't need OP/MC data.
 */
export class DeclarationOpmc extends JsonAggregateRoot<DeclarationOpmcProps, DeclarationPK> {
  get declaration(): Declaration {
    return this.props.declaration;
  }

  set declaration(declaration: Declaration) {
    this.props.declaration = declaration;
  }

  get measuresPublishDate(): Date | undefined {
    return this.props.measuresPublishDate;
  }

  set measuresPublishDate(measuresPublishDate: Date) {
    this.props.measuresPublishDate = measuresPublishDate;
  }

  get objectivesPublishDate(): Date | undefined {
    return this.props.objectivesPublishDate;
  }

  set objectivesPublishDate(objectivesPublishDate: Date) {
    this.props.objectivesPublishDate = objectivesPublishDate;
  }

  get objectivesMeasuresModalities(): NonEmptyString | undefined {
    return this.props.objectivesMeasuresModalities;
  }

  set objectivesMeasuresModalities(objectivesMeasuresModalities: NonEmptyString) {
    this.props.objectivesMeasuresModalities = objectivesMeasuresModalities;
  }
  get objectiveRemunerations(): NonEmptyString | undefined {
    return this.props.objectiveRemunerations;
  }

  set objectiveRemunerations(objectiveRemunerations: NonEmptyString) {
    this.props.objectiveRemunerations = objectiveRemunerations;
  }

  get objectiveSalaryRaise(): NonEmptyString | undefined {
    return this.props.objectiveSalaryRaise;
  }

  set objectiveSalaryRaise(objectiveSalaryRaise: NonEmptyString) {
    this.props.objectiveSalaryRaise = objectiveSalaryRaise;
  }
  get objectivePromotions(): NonEmptyString | undefined {
    return this.props.objectivePromotions;
  }

  set objectivePromotions(objectivePromotions: NonEmptyString) {
    this.props.objectivePromotions = objectivePromotions;
  }
  get objectiveSalaryRaiseAndPromotions(): NonEmptyString | undefined {
    return this.props.objectiveSalaryRaiseAndPromotions;
  }

  set objectiveSalaryRaiseAndPromotions(objectiveSalaryRaiseAndPromotions: NonEmptyString) {
    this.props.objectiveSalaryRaiseAndPromotions = objectiveSalaryRaiseAndPromotions;
  }
  get objectiveMaternityLeaves(): NonEmptyString | undefined {
    return this.props.objectiveMaternityLeaves;
  }

  set objectiveMaternityLeaves(objectiveMaternityLeaves: NonEmptyString) {
    this.props.objectiveMaternityLeaves = objectiveMaternityLeaves;
  }

  get objectiveHighRemunerations(): NonEmptyString | undefined {
    return this.props.objectiveHighRemunerations;
  }

  set objectiveHighRemunerations(objectiveHighRemunerations: NonEmptyString) {
    this.props.objectiveHighRemunerations = objectiveHighRemunerations;
  }

  public fromJson(json: Partial<EntityPropsToJson<DeclarationOpmcProps>>) {
    const props = (this ?? {}) as DeclarationOpmcProps;

    if (typeof json.declaration !== "undefined") {
      props.declaration = Declaration.fromJson(json.declaration);
    }

    if (typeof json.measuresPublishDate !== "undefined") {
      props.measuresPublishDate = new Date(json.measuresPublishDate);
    }

    if (typeof json.objectivesPublishDate !== "undefined") {
      props.objectivesPublishDate = new Date(json.objectivesPublishDate);
    }

    if (typeof json.objectivesMeasuresModalities !== "undefined") {
      props.objectivesMeasuresModalities = new NonEmptyString(json.objectivesMeasuresModalities);
    }

    if (typeof json.objectiveRemunerations !== "undefined") {
      props.objectiveRemunerations = new NonEmptyString(json.objectiveRemunerations);
    }

    if (typeof json.objectiveSalaryRaise !== "undefined") {
      props.objectiveSalaryRaise = new NonEmptyString(json.objectiveSalaryRaise);
    }

    if (typeof json.objectivePromotions !== "undefined") {
      props.objectivePromotions = new NonEmptyString(json.objectivePromotions);
    }

    if (typeof json.objectiveSalaryRaiseAndPromotions !== "undefined") {
      props.objectiveSalaryRaiseAndPromotions = new NonEmptyString(json.objectiveSalaryRaiseAndPromotions);
    }

    if (typeof json.objectiveMaternityLeaves !== "undefined") {
      props.objectiveMaternityLeaves = new NonEmptyString(json.objectiveMaternityLeaves);
    }

    if (typeof json.objectiveHighRemunerations !== "undefined") {
      props.objectiveHighRemunerations = new NonEmptyString(json.objectiveHighRemunerations);
    }

    return new DeclarationOpmc(props) as this;
  }
}
