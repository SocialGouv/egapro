import type { EntityPropsToJson } from "../../../../../common/shared-domain";
import { Url } from "../../../../../common/shared-domain";
import { JsonEntity } from "../../../../../common/shared-domain";

export interface PublicationProps {
  date: Date;
  measuresPublishDate: Date;
  modalities: string;
  objectivesMeasuresModalities: string;
  objectivesPublishDate: Date;
  url: Url;
}

export class Publication extends JsonEntity<PublicationProps, never> {
  /** Date de publication du niveau de résultat de l'entreprise ou de l'UES */
  get date(): Date {
    return this.props.date;
  }

  /** `date_publication_mesures` */
  get measuresPublishDate(): Date {
    return this.props.measuresPublishDate;
  }

  /** `modalités` */
  get modalities(): string {
    return this.props.modalities;
  }

  /** `modalités_objectifs_mesures` */
  get objectivesMeasuresModalities(): string {
    return this.props.objectivesMeasuresModalities;
  }

  /** `date_publication_objectifs` */
  get objectivesPublishDate(): Date {
    return this.props.objectivesPublishDate;
  }

  get url(): Url {
    return this.props.url;
  }

  public fromJson(json: EntityPropsToJson<PublicationProps>) {
    return new Publication({
      date: new Date(json.date),
      measuresPublishDate: new Date(json.measuresPublishDate),
      modalities: json.modalities,
      objectivesMeasuresModalities: json.objectivesMeasuresModalities,
      objectivesPublishDate: new Date(json.objectivesPublishDate),
      url: new Url(json.url),
    }) as this;
  }
}
