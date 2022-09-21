import type { FunctionComponent } from "react";
import type { PropsWithChildren } from "react";

import { Footer } from "../base/Footer";
import { Header } from "../base/Header";
import styles from "./App.module.css";

// eslint-disable-next-line @typescript-eslint/ban-types -- props with children
export type AppProps = PropsWithChildren<{}>;

export const App: FunctionComponent<AppProps> = ({ children }) => {
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
