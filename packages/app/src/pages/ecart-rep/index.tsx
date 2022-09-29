import Link from "next/link";

import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";

const title = "Êtes-vous assujetti ?";

export default function AssujettiPage() {
  return (
    <>
      <h1>{title}</h1>

      <p>TODO: contenu de la page à implémenter</p>
      <Link href="/ecart-rep/email">Aller à la validation de l'email</Link>
    </>
  );
}

AssujettiPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
