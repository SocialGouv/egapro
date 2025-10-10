"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { captureError } from "@common/error";
import { type NextErrorPageProps } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { CenteredContainer } from "@design-system";
import { useEffect } from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";
import style from "./root.module.scss";

const ErrorPage = ({ error }: NextErrorPageProps) => {
  useEffect(() => {
    captureError(error, {
      type: "client",
      url: window.location.href,
      path: window.location.pathname,
      component: "ErrorPage",
      boundary: "error.tsx",
    });

    console.log("Erreur capturée par le boundary d'erreur client:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  }, [error]);

  return (
    <>
      <Header />
      <main role="main" id="content" className={style.error}>
        <CenteredContainer py="6w">
          <DebugButton obj={error} infoText="recherche-error" />
          <Alert title="Erreur" severity="error" description={error.message} />
        </CenteredContainer>
      </main>
      <Footer />
    </>
  );
};

export default ErrorPage;
