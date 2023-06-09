import { type PropsWithChildren } from "react";

import { Footer } from "../Footer";
import { HeaderWithAuth, type HeaderWithAuthProps } from "../HeaderWithAuth";
// TODO watch https://github.com/vercel/next.js/discussions/49607
// for resolution of "[css url] was preloaded using link preload but not used within a few seconds from the window's load event." warning in dev mode
import styles from "./default.module.css";

const homeLinkProps: HeaderWithAuthProps["homeLinkProps"] = {
  href: "/",
  title: "Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion",
};

const DefaultLayout = async ({ children }: PropsWithChildren) => {
  return (
    <>
      <HeaderWithAuth homeLinkProps={homeLinkProps} />
      <main role="main" id="content" className={styles.content}>
        {children}
      </main>
      <Footer type="company" homeLinkProps={homeLinkProps} />
    </>
  );
};

export default DefaultLayout;
