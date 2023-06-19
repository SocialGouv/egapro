import { type EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

export interface PublicationProps {
  date: Date;
  modalities?: string;
  url?: string;
}

export class Publication extends JsonEntity<PublicationProps, never> {
  /** Date de publication du niveau de résultat de l'entreprise */
  get date(): Date {
    return this.props.date;
  }

  /** `modalités` */
  get modalities(): string | undefined {
    return this.props.modalities;
  }

  get url(): string | undefined {
    return this.props.url;
  }

  public fromJson(json: EntityPropsToJson<PublicationProps>) {
    const props: PublicationProps = {
      modalities: json.modalities,
      url: json.url,
      date: new Date(json.date),
    };

    return new Publication(props) as this;
  }
}
