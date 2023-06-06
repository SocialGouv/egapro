import { AuthenticatedUser } from "@components/next13/AuthenticatedUser";

import { type NextPageWithLayout } from "../../../_pages/_app";

const HomePage: NextPageWithLayout = () => {
  // redirect("/_index-egapro/declaration/commencer");
  return <AuthenticatedUser redirectTo="/_index-egapro/declaration/commencer" fallback="/login" />;
};

export default HomePage;
