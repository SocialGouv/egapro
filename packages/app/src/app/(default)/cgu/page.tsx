import { Container, Grid, GridCol } from "@design-system";

const title = "Conditions générales d’utilisation";
const description =
  "Les présentes conditions générales d’utilisation (ci-après « CGU ») fixent le cadre juridique de la Plateforme Egapro et définissent les conditions d’accès et d’utilisation des services par l’Utilisateur.";

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
          <h2>Article 1 - Champ d’application</h2>
          <p>
            La Plateforme Egapro est d’accès libre et gratuit à tout Utilisateur. La simple visite de la Plateforme
            suppose l’acceptation par tout Utilisateur des présentes conditions générales d’utilisation.
          </p>
          <p>
            L’inscription sur la Plateforme peut entraîner l’application de conditions spécifiques, listées dans les
            présentes CGU.
          </p>
          <h2>Article 2 - Objet</h2>
          <p>
            La Plateforme Egapro permet aux entreprises de déclarer aux services du ministre chargé du travail leurs
            résultats de l’index de l’égalité professionnelle entre les femmes et les hommes et, si elles sont
            assujetties, de la représentation équilibrée entre les femmes et les hommes dans les postes de direction.
          </p>
          <p>
            L’index de l’égalité professionnelle a été conçu pour faire progresser au sein des entreprises d’au moins 50
            salariés l’égalité salariale entre les femmes et les hommes. Il permet de mesurer, en toute transparence,
            les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression. Lorsque des
            disparités salariales sont constatées, des mesures de correction doivent être prises.
          </p>
          <p>
            Afin d’accélérer la participation des femmes à la vie économique et professionnelle, l’obligation de
            représentation équilibrée, parmi les cadres dirigeants et les membres des instances dirigeantes, vise à une
            plus grande égalité entre les femmes et les hommes dans les entreprises qui emploient au moins 1000 salariés
            pour le troisième exercice consécutif. Cette obligation est accompagnée d’une obligation de transparence en
            la matière.
          </p>
          <h2>Article 3 - Fonctionnalités</h2>
          <h3 className="fr-text--xl">
            3.1 Egapro sur l’index de l’égalité professionnelle entre les femmes et les hommes
          </h3>
          <p>
            Egapro a mis en place un simulateur-calculateur, permettant à tout Utilisateur, sans se créer de compte et
            après avoir saisi les données de son entreprise, d’obtenir automatiquement le résultat de chacun des
            indicateurs et de l’index. A la suite des calculs, l’Utilisateur a la possibilité de procéder à la
            déclaration.
          </p>
          <p>
            Egapro a mis en place une déclaration pour que l’Utilisateur puisse transmettre aux services du ministre
            chargé du travail les résultats obtenus aux indicateurs et à l’index ainsi que toutes les informations
            nécessaires.
          </p>
          <p>
            Egapro utilise le service d’identification MonComptePro pour garantir l’appartenance de l’Utilisateur à
            l’entreprise déclarante. L’Utilisateur doit créer un compte MonComptePro, en renseignant notamment son
            adresse mail, et s’identifier avec ce compte pour déclarer sur Egapro.
          </p>
          <h3 className="fr-text--xl">
            3.2 Egapro sur la représentation équilibrée entre les femmes et les hommes dans les postes de direction des
            grandes entreprises
          </h3>
          <p>
            Egapro a mis en place une déclaration pour que l’Utilisateur puisse transmettre aux services du ministre
            chargé du travail les écarts éventuels de représentation parmi les cadres dirigeants et les membres des
            instances dirigeantes de son entreprise ainsi que toutes les informations nécessaires.
          </p>
          <p>
            Egapro utilise le service d’identification MonComptePro pour garantir l’appartenance de l’Utilisateur à
            l’entreprise déclarante. L’Utilisateur doit créer un compte MonComptePro, en renseignant notamment son
            adresse mail, et s’identifier avec ce compte pour déclarer sur Egapro.
          </p>
          <h2>Article 4 - Responsabilités</h2>
          <h3 className="fr-text--xl">4.1 L’Éditeur de la Plateforme</h3>
          <p>
            Les sources des informations diffusées sur Egapro sont réputées fiables mais la Plateforme ne garantit pas
            qu’il soit exempt de défauts, d’erreurs ou d’omissions.
          </p>
          <p>
            Tout événement dû à un cas de force majeure ayant pour conséquence un dysfonctionnement de la Plateforme et
            sous réserve de toute interruption ou modification en cas de maintenance, n'engage pas la responsabilité de
            l’Éditeur.
          </p>
          <p>L’Éditeur s’engage à mettre en œuvre toutes mesures appropriées, afin de protéger les données traitées.</p>
          <p>
            Il s’engage à la sécurisation de la Plateforme, notamment en prenant toutes les mesures nécessaires
            permettant de garantir la sécurité et la confidentialité des informations fournies.
          </p>
          <p>
            L’Éditeur fournit les moyens nécessaires et raisonnables pour assurer un accès continu, sans contrepartie
            financière, à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou de suspendre, sans
            préavis, la plateforme pour des raisons de maintenance ou pour tout autre motif jugé nécessaire.
          </p>
          <p>
            La Plateforme peut mettre à disposition des liens pouvant orienter l’Utilisateur vers des sites réalisés par
            des tiers extérieurs. Ces tiers sont les seuls responsables du contenu publié par leur soin. L’équipe de la
            Plateforme n’a aucun contrôle sur le contenu de ces sites, ces contenus ne sauraient engager la
            responsabilité de l’Éditeur.
          </p>
          <h3 className="fr-text--xl">4.2 L’Utilisateur</h3>
          <p>
            Toute information transmise par l'Utilisateur est de sa seule responsabilité. Il est rappelé que toute
            personne procédant à une fausse déclaration pour elle-même ou pour autrui s’expose, notamment, aux sanctions
            prévues à l’article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu’à trois ans
            d’emprisonnement et 45 000 euros d’amende.
          </p>
          <p>
            L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou informations contraires aux dispositions
            légales et réglementaires en vigueur.
          </p>
          <p>
            Le contenu de l'Utilisateur peut être à tout moment et pour n'importe quelle raison supprimé ou modifié par
            l’équipe de la Plateforme, sans préavis.
          </p>
          <p>
            L’Utilisateur s’engage être titulaire d’un mandat ou d’une autorisation pour réaliser la déclaration au nom
            et pour le compte de l’entreprise.
          </p>
          <p>La violation de ces dispositions entrainera la suspension du compte.</p>
          <h2>Article 5 - Mise à jour des conditions générales d’utilisation</h2>
          <p>
            Les termes des présentes conditions générales d’utilisation peuvent être amendés à tout moment, sans
            préavis, en fonction des modifications apportées à la plateforme, de l’évolution de la législation ou pour
            tout autre motif jugé nécessaire. Chaque modification donne lieu à une nouvelle version qui est acceptée par
            les parties.
          </p>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default Cgu;
