import { config } from "@common/config";
import { AuthenticatedUser } from "@components/next13/AuthenticatedUser";

import { type NextPageWithLayout } from "../../../pages/_app";

const HomePage: NextPageWithLayout = () => {
  // redirect("config.base_declaration_url/commencer");
  return (
    <AuthenticatedUser
      redirectTo={`${config.base_declaration_url}/commencer`}
      fallback={`${config.base_declaration_url}/email`}
    />
  );
};

export default HomePage;
