import { type PropsWithChildren } from "react";

import styles from "./default.module.css";

const DefaultLayout = async ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.app}>
      <main role="main" id="content" className={styles.content}>
        {children}
      </main>
    </div>
  );
};

export default DefaultLayout;
