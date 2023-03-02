import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

export interface PublicationProps {
  date?: Date;
  measuresPublishDate?: Date;
  modalities?: string;
  objectivesMeasuresModalities?: string;
  objectivesPublishDate?: Date;
  url?: string;
}

export class Publication extends JsonEntity<PublicationProps, never> {
  /** Date de publication du niveau de résultat de l'entreprise ou de l'UES */
  get date(): Date | undefined {
    return this.props.date;
  }

  /** `date_publication_mesures` */
  get measuresPublishDate(): Date | undefined {
    return this.props.measuresPublishDate;
  }

  public setMeasuresPublishDate(measuresPublishDate: Date) {
    this.props.measuresPublishDate = new Date(measuresPublishDate);
  }

  /** `modalités` */
  get modalities(): string | undefined {
    return this.props.modalities;
  }

  /** `modalités_objectifs_mesures` */
  get objectivesMeasuresModalities(): string | undefined {
    return this.props.objectivesMeasuresModalities;
  }

  public setObjectivesMeasuresModalities(objectivesMeasuresModalities: string) {
    this.props.objectivesMeasuresModalities = objectivesMeasuresModalities;
  }

  /** `date_publication_objectifs` */
  get objectivesPublishDate(): Date | undefined {
    return this.props.objectivesPublishDate;
  }

  public setObjectivesPublishDate(objectivesPublishDate: Date) {
    this.props.objectivesPublishDate = new Date(objectivesPublishDate);
  }

  get url(): string | undefined {
    return this.props.url;
  }

  public setUrl(url: string) {
    this.props.url = url;
  }

  public fromJson(json: EntityPropsToJson<PublicationProps>) {
    const props: PublicationProps = {
      modalities: json.modalities,
      objectivesMeasuresModalities: json.objectivesMeasuresModalities,
      url: json.url,
    };

    if (json.date) props.date = new Date(json.date);
    if (json.measuresPublishDate) props.measuresPublishDate = new Date(json.measuresPublishDate);
    if (json.objectivesPublishDate) props.objectivesPublishDate = new Date(json.objectivesPublishDate);

    return new Publication(props) as this;
  }
}
