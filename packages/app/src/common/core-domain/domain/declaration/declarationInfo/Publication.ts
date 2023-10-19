import { type EntityPropsToJson, JsonEntity } from "@common/shared-domain";

export interface PublicationProps {
  /** date, modalities and url are set in regular declaration flow */
  date?: Date;
  modalities?: string;
  url?: string;
}
/* eslint-enable typescript-sort-keys/interface */

export class Publication extends JsonEntity<PublicationProps, never> {
  /** Date de publication du niveau de résultat de l'entreprise ou de l'UES */
  get date(): Date | undefined {
    return this.props.date;
  }

  /** `modalités` */
  get modalities(): string | undefined {
    return this.props.modalities;
  }

  get url(): string | undefined {
    return this.props.url;
  }

  public setUrl(url?: string) {
    this.props.url = url;
  }

  public fromJson(json: EntityPropsToJson<PublicationProps>) {
    const props: PublicationProps = {
      modalities: json.modalities,
      url: json.url,
    };

    if (json.date) props.date = new Date(json.date);

    return new Publication(props) as this;
  }
}
