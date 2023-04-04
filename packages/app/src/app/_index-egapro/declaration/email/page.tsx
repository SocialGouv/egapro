"use client";

import { EmailAuthenticator } from "@components/rdsfr/EmailAuthenticator";
import { FeatureStatusProvider } from "@components/rdsfr/FeatureStatusProvider";
import { useUserNext13 } from "@services/apiClient/useUserNext13";
import { useRouter } from "next/navigation";

const EmailPage = () => {
  const router = useRouter();
  const { user } = useUserNext13();

  const defaultRedirectTo = "/_index-egapro/declaration/commencer";

  if (user) router.push(defaultRedirectTo);

  return (
    <FeatureStatusProvider>
      <EmailAuthenticator defaultRedirectTo={defaultRedirectTo} />
    </FeatureStatusProvider>
  );
};

export default EmailPage;
