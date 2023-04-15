"use client";

import { Footer, type FooterProps } from "@codegouvfr/react-dsfr/Footer";

import { useGdprStore } from "../../design-system/base/custom/ConsentBanner";

export const ConsultationFooter = (props: Omit<FooterProps, "cookiesManagementLinkProps">) => {
  const consentModalButtonProps = useGdprStore(state => state.consentModalButtonProps);

  return (
    <>
      <Footer
        {...props}
        cookiesManagementLinkProps={{
          ...consentModalButtonProps.nativeButtonProps,
          href: "#",
          onClick(e) {
            e.preventDefault();
          },
        }}
      />
    </>
  );
};
