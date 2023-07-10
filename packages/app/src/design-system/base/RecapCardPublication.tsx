import { type Publication } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";

import { funnelStaticConfig } from "../../app/(default)/index-egapro_/declaration/declarationFunnelConfiguration";
import { RecapCard } from "./RecapCard";

type Props = {
  publication?: Publication;
};

export const RecapCardPublication = ({ publication }: Props) => {
  if (!publication?.date) return null;

  const messageDate = publication.date ? `Résultats publiés le ${formatIsoToFr(publication?.date)}` : "";

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
            {messageDate} {messageModalité}
          </p>
        </>
      }
    />
  );
};
