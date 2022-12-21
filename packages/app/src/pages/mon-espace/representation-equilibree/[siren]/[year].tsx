import { formatTimestampToFr } from "@common/utils/date";
import { normalizeQueryParam } from "@common/utils/url";
import { RepresentationEquilibreeStartLayout } from "@components/layouts/RepresentationEquilibreeStartLayout";
import { StaffOnly } from "@components/StaffOnly";
import { Alert } from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useRepresentationEquilibree } from "@services/apiClient";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import type { NextPageWithLayout } from "../../../_app";

const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false });

const title = "Représentation équilibrée";

// TODO: Remove or refactor with DetailRepartitionEquilibree component.
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
