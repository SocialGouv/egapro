import { type Publication } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";

import { funnelStaticConfig } from "../../app/(default)/index-egapro_/declaration/declarationFunnelConfiguration";
import { RecapCard } from "./RecapCard";

type Props = {
  publication?: Publication;
};

export const RecapCardPublication = ({ publication }: Props) => {
  const publicationDate = publication?.date; // Extract variable for TS to understand that publication date is not undefined.

  if (!publicationDate) return null;

  const messageModalité = publication.url
    ? ` via une publication sur le site ${publication?.url}`
    : `, avec la modalité suivante: ${publication.modalités}`;

  return (
    <RecapCard
      title="Publication des résultats obtenus"
      editLink={funnelStaticConfig["publication"].url}
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
