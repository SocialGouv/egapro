import { Entity } from "@common/shared-domain";
import type { Email, UniqueID, Url } from "@common/shared-domain/domain/valueObjects";

import type { County } from "./valueObjects/County";
import type { ReferentType } from "./valueObjects/referent/ReferentType";
import type { Region } from "./valueObjects/Region";

interface Substitute {
  email?: Email;
  name?: string;
}
interface BaseReferentProps {
  county?: County;
  name: string;
  principal: boolean;
  region: Region;
  substitute?: Substitute;
  type: ReferentType;
}

interface EmailReferentProps extends BaseReferentProps {
  type: ReferentType<"email">;
  value: Email;
}

interface UrlReferentProps extends BaseReferentProps {
  type: ReferentType<"url">;
  value: Url;
}

export type ReferentProps = EmailReferentProps | UrlReferentProps;

export class Referent extends Entity<ReferentProps, UniqueID> {
  get county(): County | undefined {
    return this.props.county;
  }
  get name(): string {
    return this.props.name;
  }
  get principal(): boolean {
    return this.props.principal;
  }
  get region(): Region {
    return this.props.region;
  }
  get substitute(): Substitute | undefined {
    return this.props.substitute;
  }
  get type(): ReferentType {
    return this.props.type;
  }
  get value() {
    return this.props.value;
  }
}
