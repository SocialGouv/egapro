import { config } from "@common/config";
import { SentryTest } from "@components/utils/SentryTest";
import { type PropsWithChildren } from "react";

import { Footer } from "../Footer";
import { Header } from "../Header";
import styles from "./default.module.css";
import { Navigation } from "./Navigation";

const DefaultLayout = async ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.app}>
      <Header
        serviceTitle="Egapro"
        serviceTagline="Indicateurs d’égalité professionnelle femmes-hommes"
        auth
        navigation={<Navigation />}
      />
      <main role="main" id="content" className={styles.content}>
        {children}
      </main>
      <Footer />
      {config.env === "dev" && <SentryTest />}
    </div>
  );
};

export default DefaultLayout;
