"use client";

import { consentModalButtonProps } from "@codegouvfr/react-dsfr/ConsentBanner";
import { Footer, type FooterProps } from "@codegouvfr/react-dsfr/Footer";

export const ConsultationFooter = (props: Omit<FooterProps, "cookiesManagementLinkProps">) => {
  return (
    <>
      <Footer
        {...props}
        cookiesManagementButtonProps={{
          ...consentModalButtonProps.nativeButtonProps,
        }}
      />
    </>
  );
};
