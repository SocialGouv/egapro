import { type Publication } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";
import { RecapCard } from "@design-system";
import { capitalize } from "lodash";

import { funnelStaticConfig } from "../../declarationFunnelConfiguration";

type Props = {
  edit?: boolean;
  publication?: Publication;
};

export const RecapCardPublication = ({ publication, edit }: Props) => {
  const publicationDate = publication?.date; // Extract variable for TS to understand that publication date is not undefined.

  if (!publicationDate) return null;

  const messageModalité = publication.url
    ? ` via une publication sur le site ${publication?.url}`
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
        </>
      }
    />
  );
};
