"use client";

import { createConsentManagement } from "@codegouvfr/react-dsfr/consentManagement";

export const {
  ConsentBannerAndConsentManagement,
  FooterConsentManagementItem,
  FooterPersonalDataPolicyItem,
  useConsent,
} = createConsentManagement({
  finalityDescription: {
    matomo: {
      title: "Matomo",
      description: "Outil d’analyse comportementale des utilisateurs.",
    },
  },
  personalDataPolicyLinkProps: {
    href: "/politique-de-confidentialite#cookies",
  },
});
