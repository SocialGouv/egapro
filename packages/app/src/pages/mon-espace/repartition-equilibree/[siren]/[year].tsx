import { useAutoAnimate } from "@formkit/auto-animate/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import type { NextPageWithLayout } from "../../../_app";
import { formatTimestampToFr } from "@common/utils/date";
import { normalizeQueryParam } from "@common/utils/router";
import { StaffOnly } from "@components/AuthenticatedOnly";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
import { Alert } from "@design-system";
import { useRepartitionEquilibree } from "@services/apiClient";

const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false });

const title = "Répartition équilibrée";

const RepartitionEquilibreeDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const siren = normalizeQueryParam(router.query.siren);
  const year = Number(normalizeQueryParam(router.query.year));

  const { repeq, error } = useRepartitionEquilibree(siren, year);

  return (
    <StaffOnly>
      <h1>{title}</h1>
      <div ref={animationParent} style={{ marginBottom: 20 }}>
        {error && <Alert type="error">{error?.message || "Erreur générale"}</Alert>}
      </div>

      {!repeq ? (
        <p>{`Aucune répartition équilibrée trouvée pour le Siren ${siren} et l'année ${year}`}</p>
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

RepartitionEquilibreeDetailPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeStartLayout>{children}</RepartitionEquilibreeStartLayout>;
};

export default RepartitionEquilibreeDetailPage;
