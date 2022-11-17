import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

import { Company } from "./declaration/Company";
import { Declarant } from "./declaration/Declarant";
import { DeclarationInfo } from "./declaration/DeclarationInfo";
import { Indicators } from "./declaration/Indicators";
import { DeclarationSource } from "./valueObjects/declaration/DeclarationSource";

export interface DeclarationDataProps {
  company: Company;
  declarant: Declarant;
  declaration: DeclarationInfo;
  indicators?: Indicators;
  source?: DeclarationSource;
}

export class DeclarationData extends JsonEntity<DeclarationDataProps> {
  /** `entreprise` */
  get company(): Company {
    return this.props.company;
  }

  /** `déclarant` */
  get declarant(): Declarant {
    return this.props.declarant;
  }

  /** `déclaration` */
  get declaration(): DeclarationInfo {
    return this.props.declaration;
  }

  get source(): DeclarationSource | undefined {
    return this.props.source;
  }

  /** `indicateurs` */
  get indicators(): Indicators | undefined {
    return this.props.indicators;
  }

  public fromJson(json: EntityPropsToJson<DeclarationDataProps> & { id: string | undefined }) {
    const props: DeclarationDataProps = {
      declarant: Declarant.fromJson(json.declarant),
      declaration: DeclarationInfo.fromJson(json.declaration),
      company: Company.fromJson(json.company),
    };

    if (json.source) props.source = new DeclarationSource(json.source);
    if (json.indicators) props.indicators = Indicators.fromJson<Indicators>(json.indicators);

    return new DeclarationData(props, json.id) as typeof this;
  }
}
