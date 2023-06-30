import { type PropsWithChildren } from "react";

import styles from "./admin.module.css";

// export const metadata = {
//   robots: {
//     index: false,
//     follow: false,
//     googleBot: {
//       follow: false,
//       index: false,
//     },
//   },
// };

const AdminLayout = ({ children }: PropsWithChildren) => (
  <div className={styles.app}>
    {/* <Header auth navigation={<Navigation />} serviceTitle="Admin Egapro" /> */}
    <main role="main" id="content" className={styles.content}>
      {children}
    </main>
    {/* <Footer type="public" /> */}
  </div>
);

export default AdminLayout;
