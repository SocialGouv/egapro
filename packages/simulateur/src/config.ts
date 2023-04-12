// L'année la plus récente à autoriser dans la page Informations calcul et période de référence.
// Permet de bloquer à une année précise, même quand on dépasse de peu le 31 décembre.
export const LAST_YEAR_FOR_DECLARATION = 2022
export const FIRST_YEAR_FOR_DECLARATION = 2018

export const indicateursInfo = {
  indicateur1: {
    title: "Indicateur écart de rémunération entre les femmes et les hommes",
  },
  indicateur2: {
    title: "Indicateur écart de taux d’augmentations entre les femmes et les hommes",
  },
  indicateur3: {
    title: "Indicateur écart de taux de promotions entre les femmes et les hommes",
  },
  indicateur2et3: {
    title: "Indicateur écart de taux d'augmentations entre les femmes et les hommes",
  },
  indicateur4: {
    title: "Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité",
  },
  indicateur5: {
    title: "Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations",
  },
}

export const nonce = process.env.REACT_APP_GITHUB_SHA || "dev"
