import type { PropsWithChildren } from "react";

import { Footer } from "../base/Footer";
import { Header } from "../base/Header";
import { SkipLinks, SkipLinksItem } from "../base/SkipLinks";
import styles from "./App.module.css";

export const App = ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.app}>
      <SkipLinks>
        <SkipLinksItem href="#content">Contenu</SkipLinksItem>
        <SkipLinksItem href="#header">Menu</SkipLinksItem>
        <SkipLinksItem href="#footer">Pied de page</SkipLinksItem>
      </SkipLinks>
      <Header />
      <main role="main" id="content" className={styles.content}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
