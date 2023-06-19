import { type PropsWithChildren } from "react";

import { Footer } from "../Footer";
import { Header } from "../Header";
// TODO watch https://github.com/vercel/next.js/discussions/49607
// for resolution of "[css url] was preloaded using link preload but not used within a few seconds from the window's load event." warning in dev mode
import styles from "./default.module.css";

const DefaultLayout = async ({ children }: PropsWithChildren) => {
  return (
    <>
      <Header auth />
      <main role="main" id="content" className={styles.content}>
        {children}
      </main>
      <Footer type="company" />
    </>
  );
};

export default DefaultLayout;
