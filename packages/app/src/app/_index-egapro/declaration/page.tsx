import { AuthenticatedUser } from "@components/next13/AuthenticatedUser";

import type { NextPageWithLayout } from "../../../pages/_app";

const HomePage: NextPageWithLayout = () => {
  return (
    <AuthenticatedUser redirectTo="/_index-egapro/declaration/commencer" fallback="/_index-egapro/declaration/email" />
  );
};

export default HomePage;
