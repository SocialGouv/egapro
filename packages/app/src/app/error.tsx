"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";

import style from "./root.module.scss";

const ErrorPage = ({ error }) => {
  return (
    <>
      <main role="main" id="content" className={style.error}>
        <Alert title="Erreur" severity="error" description={error.message} />
      </main>
    </>
  );
};

export default ErrorPage;
