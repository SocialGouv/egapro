import { Container } from "@design-system";
import { type PropsWithChildren } from "react";

import { Footer } from "../Footer";
import { Header } from "../Header";
import { ConsultationBreadcrumb } from "./Breadcrumb";
import styles from "./consultation.module.css";
import { Navigation } from "./Navigation";

export const metadata = {
  title: {
    template: "Recherche - %s",
    default: "Recherche",
  },
  openGraph: {
    title: { template: "Egapro Recherche - %s", default: "Recherche" },
  },
};

const ConsultationLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Header serviceTitle="Egapro - Recherche" navigation={<Navigation />} />
      <main role="main" id="content" className={styles.content}>
        <Container>
          <ConsultationBreadcrumb />
        </Container>
        {children}
      </main>
      <Footer />
    </>
  );
};

export default ConsultationLayout;
