import { type EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

import { Siren } from "../../valueObjects/Siren";

type UesCompany = {
  /** `raison_sociale` */
  name: string;
  siren: Siren;
};

export interface UesProps {
  companies: UesCompany[];
  name?: string;
}
export class UES extends JsonEntity<UesProps, never> {
  /** `entreprises` */
  get companies(): UesCompany[] {
    return [...this.props.companies];
  }

  /** `nom` */
  get name(): string | undefined {
    return this.props.name;
  }

  public fromJson(json: EntityPropsToJson<UesProps>) {
    return new UES({
      name: json.name,
      companies: json.companies.map(jsonCompany => ({
        name: jsonCompany.name,
        siren: new Siren(jsonCompany.siren),
      })),
    }) as this;
  }
}
