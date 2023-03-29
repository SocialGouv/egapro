import { redirect } from "next/navigation";

import type { NextPageWithLayout } from "../../../pages/_app";

const HomePage: NextPageWithLayout = () => {
  // TODO next13 useUser
  // const { user } = useUser();
  const user = true;
  const defaultRedirectTo = "/_index-egapro/declaration/commencer";

  if (user) redirect(defaultRedirectTo);
  redirect("/_index-egapro/declaration/email");
};

export default HomePage;
