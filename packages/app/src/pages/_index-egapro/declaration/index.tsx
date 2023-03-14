import { useUser } from "@services/apiClient";
import { useRouter } from "next/router";
import { useEffect } from "react";

import type { NextPageWithLayout } from "../../_app";

export const HomePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const defaultRedirectTo = "/_index-egapro/declaration/commencer";
  // const { redirectTo } = normalizeRouterQuery(router.query);

  useEffect(() => {
    if (user) router.push(defaultRedirectTo);
    router.push("/_index-egapro/declaration/email"), [];
  });

  return null;
};

export default HomePage;
