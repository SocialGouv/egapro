import { AssujettiForm } from "./Form";

const title = "Êtes-vous assujetti ?";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const AssujettiPage = async () => {
  return (
    <>
      <h1>{title}</h1>
      <p>
        Toutes les entreprises et unités économiques et sociales (UES) d'au moins 50 salariés doivent calculer, publier
        et déclarer chaque année au plus le 1er mars leur index de l'égalité professionnelle entre les femmes et les
        hommes.
      </p>
      <p>
        L'assujettissement est défini à la date de l’obligation de publication de l’index, soit le 1er mars. Le calcul
        des effectifs assujettis de l’entreprise ou de l’unité économique et sociale (UES) est celui prévu aux articles
        L.1111-2 et L.1111-3 du code du travail.
      </p>

      <AssujettiForm title={title} />
    </>
  );
};

export default AssujettiPage;
