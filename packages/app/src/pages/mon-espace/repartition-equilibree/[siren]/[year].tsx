import { useAutoAnimate } from "@formkit/auto-animate/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import type { NextPageWithLayout } from "../../../_app";
import { formatTimestampToFr } from "@common/utils/date";
import { normalizeQueryParam } from "@common/utils/router";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
import { Alert } from "@design-system";
import { useRepartitionEquilibree, useUser } from "@services/apiClient";

const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false });

const title = "Répartition équilibrée";

const RepartitionEquilibreeDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: "/ecart-rep/email" });
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const siren = normalizeQueryParam(router.query.siren);
  const year = Number(normalizeQueryParam(router.query.year));

  const { repeq, error } = useRepartitionEquilibree(siren, year);

  // useEffect(() => {
  //   if (!user?.staff) router.push("/ecart-rep/email");
  // }, [user?.staff, router]);

  return (
    <>
      <h1>{title}</h1>

      <div ref={animationParent} style={{ marginBottom: 20 }}>
        {error && <Alert type="error">{error}</Alert>}
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
    </>
  );
};

RepartitionEquilibreeDetailPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeStartLayout>{children}</RepartitionEquilibreeStartLayout>;
};

export default RepartitionEquilibreeDetailPage;
