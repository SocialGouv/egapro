import { type EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { CountryCode } from "../valueObjects/CountryCode";
import { County } from "../valueObjects/County";
import { CompanyWorkforceRange } from "../valueObjects/declaration/CompanyWorkforceRange";
import { FrenchPostalCode } from "../valueObjects/FrenchPostalCode";
import { NafCode } from "../valueObjects/NafCode";
import { Region } from "../valueObjects/Region";
import { Siren } from "../valueObjects/Siren";
import { UES } from "./company/UES";

type Workforce = {
  range?: CompanyWorkforceRange;
  total?: PositiveNumber;
};
export interface CompanyProps {
  address?: string;
  city?: string;
  countryCode?: CountryCode;
  county?: County;
  hasRecoveryPlan: boolean;
  nafCode?: NafCode;
  name?: string;
  postalCode?: FrenchPostalCode;
  region?: Region;
  siren: Siren;
  ues?: UES;
  workforce?: Workforce;
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
  get hasRecoveryPlan(): boolean {
    return this.props.hasRecoveryPlan;
  }

  /** `code_naf` */
  get nafCode(): NafCode | undefined {
    return this.props.nafCode;
  }

  /** `raison_sociale` */
  get name(): string | undefined {
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

  /** `effectif` */
  get workforce(): Workforce | undefined {
    return this.props.workforce;
  }

  public fromJson(json: EntityPropsToJson<CompanyProps>) {
    const props: CompanyProps = {
      name: json.name,
      siren: new Siren(json.siren),
      address: json.address,
      city: json.city,
      hasRecoveryPlan: json.hasRecoveryPlan,
    };

    if (json.countryCode) {
      props.countryCode = new CountryCode(json.countryCode);
    }

    if (json.county) {
      props.county = new County(json.county);
    }

    if (json.nafCode) {
      props.nafCode = new NafCode(json.nafCode);
    }

    if (json.postalCode) {
      props.postalCode = new FrenchPostalCode(json.postalCode);
    }

    if (json.region) {
      props.region = new Region(json.region);
    }

    if (json.ues) {
      props.ues = UES.fromJson(json.ues);
    }

    if (json.workforce) {
      props.workforce = {
        range: json.workforce.range ? new CompanyWorkforceRange(json.workforce.range) : void 0,
        total: typeof json.workforce.total === "number" ? new PositiveNumber(json.workforce.total) : void 0,
      };
    }

    return new Company(props) as this;
  }
}
