import { CorrectiveMeasures } from "@common/core-domain/domain/valueObjects/declaration/declarationInfo/CorrectiveMeasures";
import { type Publication } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";
import { RecapCard } from "@design-system";
import { capitalize } from "lodash";

import { funnelStaticConfig } from "../../declarationFunnelConfiguration";

type Props = {
  edit?: boolean;
  mesures?: CorrectiveMeasures.Enum;
  publication?: Publication;
};

export const RecapCardPublication = ({ publication, edit, mesures }: Props) => {
  const publicationDate = publication?.date; // Extract variable for TS to understand that publication date is not undefined.

  if (!publicationDate) return null;

  const messageModalité = publication.url
    ? ` via une publication sur le site ${publication?.url}.`
    : ` avec la modalité suivante : ${capitalize(publication.modalités)}`;

  return (
    <RecapCard
      title="Publication des résultats obtenus"
      editLink={(edit || void 0) && funnelStaticConfig["publication"].url}
      content={
        <>
          <p>
            Résultats publiés le <strong>{formatIsoToFr(publicationDate)}</strong> {messageModalité}
          </p>
          {mesures && (
            <p>
              Mesures de correction prévues à l'article D. 1142-6: <i>{CorrectiveMeasures.Label[mesures]}</i>
            </p>
          )}
        </>
      }
    />
  );
};
