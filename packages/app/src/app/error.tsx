"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { type NextErrorPageProps } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";

import { CenteredContainer } from "../design-system/layout/CenteredContainer";
import { Footer } from "./Footer";
import { Header } from "./Header";

const ErrorPage = ({ error }: NextErrorPageProps) => {
  return (
    <>
      <Header />
      <main role="main" id="content" style={{ flexGrow: 1 }}>
        <CenteredContainer py="6w">
          <DebugButton obj={error} infoText="recherche-error" />
          <Alert title="Erreur" severity="error" description={error.message} />
        </CenteredContainer>
      </main>
      <Footer type="public" />
    </>
  );
};

export default ErrorPage;
