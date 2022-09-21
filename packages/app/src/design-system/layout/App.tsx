import type { FunctionComponent } from "react";

import { Footer } from "../base/Footer";
import { Header } from "../base/Header";
import styles from "./App.module.css";

export const App: FunctionComponent = ({ children }) => {
  return (
    <div className={styles.app}>
      <Header />
      <main role="main" id="content" className={styles.content}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
