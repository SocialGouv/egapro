import { useRouter } from "next/router";
import * as React from "react";

import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";

const title = "Commencer";

export default function CommencerPage() {
  const { isAuthenticated } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) router.push("/ecart-rep");
  }, [isAuthenticated, router]);

  return <h1>{title}</h1>;
}

CommencerPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
