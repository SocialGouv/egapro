import { type EntityPropsToJson, JsonEntity } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";

export interface DeclarantProps {
  email: Email;
  firstname: string;
  lastname: string;
  phone: string;
}

export class Declarant extends JsonEntity<DeclarantProps, never> {
  get email(): Email {
    return this.props.email;
  }

  /** `prénom` */
  get firstname(): string {
    return this.props.firstname;
  }

  /** `nom` */
  get lastname(): string {
    return this.props.lastname;
  }

  /** `téléphone` */
  get phone(): string {
    return this.props.phone;
  }

  public fromJson(json: EntityPropsToJson<DeclarantProps>) {
    const props: DeclarantProps = {
      ...json,
      email: new Email(json.email),
    };

    return new Declarant(props) as this;
  }
}
