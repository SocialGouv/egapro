import { type EntityPropsToJson, JsonEntity } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { CountryCode } from "../valueObjects/CountryCode";
import { County } from "../valueObjects/County";
import { CompanyWorkforceRange } from "../valueObjects/declaration/CompanyWorkforceRange";
import { FrenchPostalCode } from "../valueObjects/FrenchPostalCode";
import { NafCode } from "../valueObjects/NafCode";
import { Region } from "../valueObjects/Region";
import { Siren } from "../valueObjects/Siren";
import { UES } from "./company/UES";

export interface CompanyProps {
  address?: string;
  city?: string;
  countryCode?: CountryCode;
  county?: County;
  hasRecoveryPlan?: boolean;
  nafCode?: NafCode;
  name: string;
  postalCode?: FrenchPostalCode;
  range?: CompanyWorkforceRange;
  region?: Region;
  siren: Siren;
  total?: PositiveNumber;
  ues?: UES;
  workforce?: { range: CompanyWorkforceRange; total: PositiveNumber };
}

export class Company extends JsonEntity<CompanyProps, never> {
  /** `adresse` */
  get address(): string | undefined {
    return this.props.address;
  }

  /** `commune` */
  get city(): string | undefined {
    return this.props.city;
  }

  /** `code_pays` */
  get countryCode(): CountryCode | undefined {
    return this.props.countryCode;
  }

  /** `département` */
  get county(): County | undefined {
    return this.props.county;
  }

  /** `plan_relance` */
  get hasRecoveryPlan(): boolean | undefined {
    return this.props.hasRecoveryPlan;
  }

  /** `code_naf` */
  get nafCode(): NafCode | undefined {
    return this.props.nafCode;
  }

  /** `raison_sociale` */
  get name(): string {
    return this.props.name;
  }

  /** `code_postal` */
  get postalCode(): FrenchPostalCode | undefined {
    return this.props.postalCode;
  }

  /** `région` */
  get region(): Region | undefined {
    return this.props.region;
  }

  get siren(): Siren {
    return this.props.siren;
  }

  get ues(): UES | undefined {
    return this.props.ues;
  }

  get total(): PositiveNumber | undefined {
    return this.props.total;
  }

  get range(): CompanyWorkforceRange | undefined {
    return this.props.range;
  }

  public fromJson(json: EntityPropsToJson<CompanyProps>) {
    const props: CompanyProps = {
      name: json.name,
      siren: new Siren(json.siren),
      address: json.address,
      city: json.city,
    };

    if (json.nafCode && (json.nafCode as string) !== "[NON-DIFFUSIBLE]") {
      props.nafCode = new NafCode(json.nafCode);
    }

    if (typeof json.hasRecoveryPlan === "boolean") {
      props.hasRecoveryPlan = json.hasRecoveryPlan;
    }

    if (json.countryCode) {
      props.countryCode = new CountryCode(json.countryCode);
    }

    if (json.county && (json.county as string) !== "[NON-DIFFUSIBLE]") {
      props.county = new County(json.county);
    }

    if (json.postalCode && json.countryCode) {
      props.postalCode = new FrenchPostalCode(json.postalCode, json.countryCode);
    }

    if (json.region && (json.region as string) !== "[NON-DIFFUSIBLE]") {
      props.region = new Region(json.region);
    }

    if (json.ues) {
      props.ues = UES.fromJson(json.ues);
    }

    if (json.workforce) {
      props.total = new PositiveNumber(json.workforce.total);
      props.range = new CompanyWorkforceRange(json.workforce.range);
      props.workforce = {
        range: new CompanyWorkforceRange(json.workforce.range),
        total: new PositiveNumber(json.workforce.total),
      };
    }

    if (json.total) {
      props.total = new PositiveNumber(json.total);
    }

    if (json.range) {
      props.range = new CompanyWorkforceRange(json.range);
    }

    return new Company(props) as this;
  }
}
