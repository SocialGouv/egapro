"use client";

import { config } from "@common/config";
import { FeatureStatusProvider } from "@components/FeatureStatusProvider";
import { EmailAuthenticator } from "@components/next13/EmailAuthenticator";
import { useUserNext13 } from "@services/apiClient/useUserNext13";
import { useRouter } from "next/navigation";

/**
 * @deprecated
 * TODO: créer une page email de connexion unique pour tous les fronts. Cf chantier NextAuth.
 */
const EmailPage = () => {
  const router = useRouter();
  const { user } = useUserNext13();

  const defaultRedirectTo = config.base_declaration_url + "/commencer";

  if (user) router.push(defaultRedirectTo);

  return (
    <FeatureStatusProvider>
      <EmailAuthenticator defaultRedirectTo={defaultRedirectTo} />
    </FeatureStatusProvider>
  );
};

export default EmailPage;
