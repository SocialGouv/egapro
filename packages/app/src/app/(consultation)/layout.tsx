import Header, { type HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { Brand } from "@components/Brand";
import { Container } from "@design-system";
import { type PropsWithChildren } from "react";

import { Footer } from "../Footer";
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

const homeLinkProps: HeaderProps["homeLinkProps"] = {
  href: "/",
  title: "Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion",
};

const brand = <Brand />;

const ConsultationLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Header
        brandTop={brand}
        serviceTitle="Egapro - Recherche"
        serviceTagline="Index de l’égalité professionnelle et représentation équilibrée femmes – hommes"
        homeLinkProps={homeLinkProps}
        navigation={<Navigation />}
      />
      <main role="main" id="content" className={styles.content}>
        <Container>
          <ConsultationBreadcrumb />
        </Container>
        {children}
      </main>
      <Footer type="public" homeLinkProps={homeLinkProps} />
    </>
  );
};

export default ConsultationLayout;
