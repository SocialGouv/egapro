import { DeclarationLayout } from "@components/layouts/DeclarationLayout";
import { EmailAuthenticator } from "@components/rdsfr/EmailAuthenticator";
import { FeatureStatusProvider } from "@components/rdsfr/FeatureStatusProvider";
import { useUser } from "@services/apiClient";
import { useRouter } from "next/router";

import type { NextPageWithLayout } from "../../_app";

export const EmailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();

  const defaultRedirectTo = "/_index-egapro/declaration/commencer";

  if (user) router.push(defaultRedirectTo);

  return <EmailAuthenticator defaultRedirectTo={defaultRedirectTo} />;
};

EmailPage.getLayout = ({ children }) => {
  return (
    <DeclarationLayout title="Validation de l'email">
      <FeatureStatusProvider>{children}</FeatureStatusProvider>
    </DeclarationLayout>
  );
};

export default EmailPage;
