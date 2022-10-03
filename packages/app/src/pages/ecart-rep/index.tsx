import Link from "next/link";

import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";

const title = "Êtes-vous assujetti ?";

const AssujettiPage: NextPageWithLayout = () => {
  return (
    <>
      <h1>{title}</h1>

      <p>TODO: contenu de la page à implémenter</p>
      <Link href="/ecart-rep/email">Aller à la validation de l'email</Link>
    </>
  );
};

AssujettiPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeStartLayout>{children}</RepartitionEquilibreeStartLayout>;
};

export default AssujettiPage;
