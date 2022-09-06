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
  indicators: Indicators;
  source: DeclarationSource;
}

export class DeclarationData extends JsonEntity<DeclarationDataProps, never> {
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

  get source(): DeclarationSource {
    return this.props.source;
  }

  /** `indicateurs` */
  get indicators(): Indicators {
    return this.props.indicators;
  }

  public fromJson(raw: EntityPropsToJson<DeclarationDataProps>) {
    return new DeclarationData({
      declarant: Declarant.fromJson(raw.declarant),
      declaration: DeclarationInfo.fromJson(raw.declaration),
      source: new DeclarationSource(raw.source),
      company: Company.fromJson(raw.company),
      indicators: Indicators.fromJson(raw.indicators),
    }) as typeof this;
  }
}
