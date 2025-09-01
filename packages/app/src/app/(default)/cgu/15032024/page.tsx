import { Container, Grid, GridCol } from "@design-system";

const title = "Egapro - Conditions générales d'utilisation";
const description =
  "Les présentes conditions générales d'utilisation (ci-après «CGU») fixent le cadre juridique de la Plateforme Egapro et définissent les conditions d'accès et d'utilisation des services par l'Utilisateur.";

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
};

const Cgu = () => {
  return (
    <Container py="8w">
      <Grid align="center">
        <GridCol md={10} lg={8}>
          <h1>{title}</h1>
          <p>{description}</p>
          <h2>Article 1 - Champ d'application</h2>
          <p>
            La Plateforme est d'accès libre et gratuit à tout Utilisateur. La simple visite de la Plateforme suppose
            l'acceptation par tout Utilisateur des présentes conditions générales d'utilisation.
          </p>
          <p>
            L'inscription sur la Plateforme peut entraîner l'application de conditions spécifiques, listées dans les
            présentes CGU.
          </p>
          <h2>Article 2 - Objet</h2>
          <p>Egapro met en place deux index conçus pour lutter contre l'inégalité entre les femmes et les hommes.</p>
          <p>
            Le premier Index Egapro est un outil de calcul et de déclaration visant à faire progresser au sein des
            entreprises l'égalité salariale entre les femmes et les hommes. Il permet aux entreprises de mesurer, en
            toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de
            progression.
          </p>
          <p>
            Le second Index Egapro est un outil visant à faire progresser au sein des entreprises l'égalité
            professionnelle et la représentation équilibrée femmes‑hommes dans les services dirigeants. Il permet aux
            entreprises de mesurer, en toute transparence, les écarts de représentation dans les services dirigeants et
            de mettre en évidence leurs points de progression.
          </p>
          <h2>Article 3 - Fonctionnalités</h2>
          <h3 className="fr-text--xl">3.1 Index Egapro sur l'égalité professionnelle</h3>
          <p>
            Egapro a mis en place un simulateur en ligne grâce auquel tout utilisateur, sans se créer de compte, peut
            remplir des informations concernant son entreprise afin de calculer son Index et de connaître les écarts de
            salaire entre hommes et femmes au sein de sa structure.
          </p>
          <p>
            Dans le cadre du remplissage de ce formulaire, l'Utilisateur a la possibilité d'enregistrer les données
            fournies pour les déclarer au ministère du Travail. Egapro utilise le service d'identification MonComptepro
            pour garantir l'appartenance de l'Utilisateur aux entreprises déclarantes. L'Utilisateur renseigne donc son
            adresse e-mail professionnelle via MonComptePro.
          </p>
          <p>La Plateforme propose également une FAQ et un moteur de recherche.</p>
          <h3 className="fr-text--xl">
            3.2 Index Egapro sur la représentation équilibrée entre hommes et femmes au sein des postes dirigeants des
            grandes entreprises
          </h3>
          <p>
            Egapro a mis en place une déclaration sur la représentation équilibrée afin qu'elle soit transmise au
            ministère du Travail. Tout Utilisateur, dès lors que son entreprise est assujettie à la publication et la
            déclaration de l'Index car elle emploie au moins 1000 salariés, peut déclarer les écarts de représentation
            entre les femmes et les hommes dans les postes de direction de son entreprise. L'Utilisateur utilise le
            service d'identification MonComptePro et renseigne son adresse e-mail professionnelle. L'Utilisateur remplit
            notamment des informations le concernant, des informations concernant son entreprise en prenant en compte la
            période de référence, les écarts de représentation. Le déclarant renseigne son nom, prénom, son adresse
            e-mail, son numéro de téléphone mais également le numéro SIREN de son entreprise afin de réaliser sa
            déclaration concernant la représentation équilibrée.
          </p>
          <h2>Article 4 - Responsabilités</h2>
          <h3 className="fr-text--xl">4.1 L'Éditeur de la Plateforme</h3>
          <p>
            Les sources des informations diffusées sur Egapro sont réputées fiables mais la Plateforme ne garantit pas
            qu'il soit exempt de défauts, d'erreurs ou d'omissions.
          </p>
          <p>
            Tout événement dû à un cas de force majeure ayant pour conséquence un dysfonctionnement de la Plateforme et
            sous réserve de toute interruption ou modification en cas de maintenance, n'engage pas la responsabilité de
            l'Éditeur.
          </p>
          <p>L'Éditeur s'engage à mettre en œuvre toutes mesures appropriées, afin de protéger les données traitées.</p>
          <p>
            Il s'engage à la sécurisation de la Plateforme, notamment en prenant toutes les mesures nécessaires
            permettant de garantir la sécurité et la confidentialité des informations fournies.
          </p>
          <p>
            L'Éditeur fournit les moyens nécessaires et raisonnables pour assurer un accès continu, sans contrepartie
            financière, à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou de suspendre, sans
            préavis, la plateforme pour des raisons de maintenance ou pour tout autre motif jugé nécessaire.
          </p>
          <p>
            La Plateforme peut mettre à disposition des liens pouvant orienter l'Utilisateur vers des sites réalisés par
            des tiers extérieurs. Ces tiers sont les seuls responsables du contenu publié par leur soin. L'équipe de la
            Plateforme n'a aucun contrôle sur le contenu de ces sites, ces contenus ne sauraient engager la
            responsabilité de l'Éditeur.
          </p>
          <h3 className="fr-text--xl">4.2 L'Utilisateur</h3>
          <p>
            Toute information transmise par l'Utilisateur est de sa seule responsabilité. Il est rappelé que toute
            personne procédant à une fausse déclaration pour elle-même ou pour autrui s'expose, notamment, aux sanctions
            prévues à l'article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu'à trois ans
            d'emprisonnement et 45 000 euros d'amende.
          </p>
          <p>
            L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou informations contraires aux dispositions
            légales et réglementaires en vigueur.
          </p>
          <p>
            Le contenu de l'Utilisateur peut être à tout moment et pour n'importe quelle raison supprimé ou modifié par
            le site, sans préavis.
          </p>
          <p>
            L'Utilisateur s'engage être titulaire d'un mandat ou d'une autorisation à réaliser la déclaration au nom et
            pour le compte de l'entreprise.
          </p>
          <p>La violation de ces dispositions entrainera la suspension du compte.</p>
          <h2>Article 5 - Mise à jour des conditions générales d'utilisation</h2>
          <p>
            Les termes des présentes conditions générales d'utilisation peuvent être amendés à tout moment, sans
            préavis, en fonction des modifications apportées à la plateforme, de l'évolution de la législation ou pour
            tout autre motif jugé nécessaire. Chaque modification donne lieu à une nouvelle version qui est acceptée par
            les parties.
          </p>
          <p>
            <a href="/cgu/08022021">Version du 08/02/2021</a>
          </p>
          <p>
            <a href="/cgu/12102022">Version du 12/10/2022</a>
          </p>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default Cgu;
