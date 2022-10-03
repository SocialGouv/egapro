import { useRouter } from "next/router";

import { useEffect } from "react";
import type { NextPageWithLayout } from "../_app";
import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";

const title = "Commencer";

const CommencerPage: NextPageWithLayout = () => {
  const { isAuthenticated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push("/ecart-rep");
  }, [isAuthenticated, router]);

  return <h1>{title}</h1>;
};

CommencerPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default CommencerPage;
