import { type PropsWithChildren } from "react";

import { Navigation } from "../(default)/Navigation";
import { Footer } from "../Footer";
import { Header } from "../Header";
import styles from "./admin.module.css";

const defaultTitle = "Egapro Backoffice";
const description = "Console d'administration Egapro";
export const metadata = {
  description,
  title: {
    template: "%s - Egapro Backoffice",
    default: defaultTitle,
  },
  openGraph: {
    title: {
      template: "%s - Egapro Backoffice",
      default: defaultTitle,
    },
    description,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      follow: false,
      index: false,
    },
  },
};

const AdminLayout = ({ children }: PropsWithChildren) => (
  <div className={styles.app}>
    <Header auth navigation={<Navigation />} serviceTitle={defaultTitle} serviceTagline={description} />
    <main role="main" id="content" className={styles.content}>
      {children}
    </main>
    <Footer type="public" />
  </div>
);

export default AdminLayout;
