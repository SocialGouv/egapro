import { useAutoAnimate } from "@formkit/auto-animate/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import type { NextPageWithLayout } from "../../../_app";
import { formatTimestampToFr } from "@common/utils/date";
import { normalizeQueryParam } from "@common/utils/router";
import { StaffOnly } from "@components/AuthenticatedOnly";
import { RepresentationEquilibreeStartLayout } from "@components/layouts/RepresentationEquilibreeStartLayout";
import { Alert } from "@design-system";
import { useRepresentationEquilibree } from "@services/apiClient";

const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false });

const title = "Représentation équilibrée";

const RepresentationEquilibreeDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const siren = normalizeQueryParam(router.query.siren);
  const year = Number(normalizeQueryParam(router.query.year));

  const { repeq, error } = useRepresentationEquilibree(siren, year);

  return (
    <StaffOnly>
      <h1>{title}</h1>
      <div ref={animationParent} style={{ marginBottom: 20 }}>
        {error && <Alert type="error">{error?.message || "Erreur générale"}</Alert>}
      </div>

      {!repeq ? (
        <p>{`Aucune représentation équilibrée trouvée pour le Siren ${siren} et l'année ${year}`}</p>
      ) : (
        <DynamicReactJson
          src={{
            ...repeq,
            modified_at: formatTimestampToFr(repeq.modified_at),
            declared_at: formatTimestampToFr(repeq.modified_at),
          }}
          displayDataTypes={false}
          displayObjectSize={false}
          name={false}
        />
      )}
    </StaffOnly>
  );
};

RepresentationEquilibreeDetailPage.getLayout = ({ children }) => {
  return <RepresentationEquilibreeStartLayout>{children}</RepresentationEquilibreeStartLayout>;
};

export default RepresentationEquilibreeDetailPage;
