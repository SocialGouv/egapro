import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { CountryCode } from "../valueObjects/CountryCode";
import { CompanyWorkforceRange } from "../valueObjects/declaration/CompanyWorkforceRange";
import { Department } from "../valueObjects/Department";
import { FrenchPostalCode } from "../valueObjects/FrenchPostalCode";
import { NafCode } from "../valueObjects/NafCode";
import { Region } from "../valueObjects/Region";
import { Siren } from "../valueObjects/Siren";
import { UES } from "./company/UES";

type Workforce = {
  range: CompanyWorkforceRange;
  total: PositiveNumber;
};
export interface CompanyProps {
  adress: string;
  city: string;
  countryCode: CountryCode;
  department: Department;
  hasRecoveryPlan: boolean;
  nafCode?: NafCode;
  name: string;
  postalCode: FrenchPostalCode;
  region: Region;
  siren: Siren;
  ues: UES;
  workforce: Workforce;
}

export class Company extends JsonEntity<CompanyProps, never> {
  /** `adresse` */
  get adress(): string {
    return this.props.adress;
  }

  /** `commune` */
  get city(): string {
    return this.props.city;
  }

  /** `code_pays` */
  get countryCode(): CountryCode {
    return this.props.countryCode;
  }

  /** `département` */
  get department(): Department {
    return this.props.department;
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
  get name(): string {
    return this.props.name;
  }

  /** `code_postal` */
  get postalCode(): FrenchPostalCode {
    return this.props.postalCode;
  }

  /** `région` */
  get region(): Region {
    return this.props.region;
  }

  get siren(): Siren {
    return this.props.siren;
  }

  get ues(): UES {
    return this.props.ues;
  }

  /** `effectif` */
  get workforce(): Workforce {
    return this.props.workforce;
  }

  public fromJson(json: EntityPropsToJson<CompanyProps>) {
    const props: CompanyProps = {
      name: json.name,
      siren: new Siren(json.siren),
      region: new Region(json.region),
      department: new Department(json.department),
      adress: json.adress,
      city: json.city,
      postalCode: new FrenchPostalCode(json.postalCode),
      countryCode: new CountryCode(json.countryCode),
      hasRecoveryPlan: json.hasRecoveryPlan,
      workforce: {
        range: new CompanyWorkforceRange(json.workforce.range),
        total: new PositiveNumber(json.workforce.total),
      },
      ues: UES.fromJson(json.ues),
    };

    if (json.nafCode) {
      props.nafCode = new NafCode(json.nafCode);
    }

    return new Company(props) as this;
  }
}
