import { authConfig } from "@api/core-domain/infra/auth/config";
import { getServerSession } from "next-auth";
import { type PropsWithChildren } from "react";

import { Footer } from "../Footer";
import { Header } from "../Header";
// TODO watch https://github.com/vercel/next.js/discussions/49607
// for resolution of "[css url] was preloaded using link preload but not used within a few seconds from the window's load event." warning in dev mode
import styles from "./default.module.css";
import { LoginRedirect } from "./login/LoginRedirect";
import { Navigation } from "./Navigation";

const DefaultLayout = async ({ children }: PropsWithChildren) => {
  const session = await getServerSession(authConfig);
  return (
    <div className={styles.app}>
      <LoginRedirect session={session} />
      <Header auth navigation={<Navigation />} />
      <main role="main" id="content" className={styles.content}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default DefaultLayout;
