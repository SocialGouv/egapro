import { type Publication } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";
import { RecapCard } from "@design-system";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";

type Props = {
  editable?: boolean;
  publication?: Publication;
};

export const RecapCardPublication = ({ publication, editable }: Props) => {
  const publicationDate = publication?.date; // Extract variable for TS to understand that publication date is not undefined.

  editable = editable ?? false;

  if (!publicationDate) return null;

  const messageModalité = publication.url
    ? ` via une publication sur le site ${publication?.url}`
    : `, avec la modalité suivante: ${publication.modalités}`;

  return (
    <RecapCard
      title="Publication des résultats obtenus"
      {...{ editLink: editable ? funnelStaticConfig["publication"].url : undefined }}
      content={
        <>
          <p>
            Résultats publiés le <strong>{formatIsoToFr(publicationDate)}</strong> {messageModalité}.
          </p>
        </>
      }
    />
  );
};
