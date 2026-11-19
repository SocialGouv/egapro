import { Container, Grid, GridCol } from "@design-system";

const title = "Egapro - Conditions générales d'utilisation";
const description =
  "Les présentes conditions générales d’utilisation (ci-après « CGU ») précisent le cadre juridique de « Egapro » (ci-après la « Plateforme ») et définissent les conditions d’accès et d’utilisation des Services par l’Utilisateur.";

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
          <h1>Conditions générales d’utilisation</h1>
          <h2>Article 1 - Champ d’application</h2>
          <p>
            Les présentes conditions générales d’utilisation (ci-après « CGU ») précisent le cadre juridique de « Egapro
            » (ci-après la « Plateforme ») et définissent les conditions d’accès et d’utilisation des Services par
            l’Utilisateur.
          </p>
          <p>L’inscription sur la Plateforme est subordonnée à l’acceptation et au respect des présentes CGU.</p>
          <h2>Article 2 - Objet</h2>
          <p>
            La Plateforme Egapro permet aux entreprises d’effectuer leurs déclarations, auprès des services du ministre
            chargé du travail, relatives à l’index de l’égalité professionnelle entre les femmes et les hommes et, si
            elles sont assujetties, à la représentation équilibrée entre les femmes et les hommes dans les postes de
            direction.
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
          <h2>Article 3 - Définitions</h2>
          <p>
            « Utilisateur », toute personne physique autorisée par une entreprise à effectuer les déclarations pour son
            compte.
          </p>
          <p>
            « Déclaration » consiste à la transmission des résultats et des informations complémentaires de l’index de
            l’égalité professionnelle et le cas échéant de la représentation équilibrée.
          </p>
          <p>
            « Index de l’égalité professionnelle » sont les indicateurs prévus aux articles D. 1142-2, D. 1142-2-1, D.
            1142-3 du décret n°2019-15 du 8 janvier 2019 portant application des dispositions visant à supprimer les
            écarts de rémunération entre les femmes et les hommes dans l’entreprise et relatives à la lutte contre les
            violences sexuelles et les agissements sexistes au travail.
          </p>
          <p>
            « Représentation équilibrée » sont les écarts prévus à l’article 14 de la loi n°2021-1774 du 24 décembre
            2021 visant à accélérer l'égalité économique et professionnelle.
          </p>
          <p>
            « Entreprises », sont les entreprises, les associations, les syndicats, les structures publiques ou mixtes
            employant au moins 50 salariés dans des conditions de droit privé.
          </p>
          <p>« Public », toute personne qui navigue sur le site, sans se créer un compte « Utilisateur ».</p>
          <h2>Article 4 - Fonctionnalités</h2>
          <h3>4.1 Création de compte</h3>
          <p>
            Pour effectuer la déclaration de l’index de l’égalité professionnelle ou de la représentation équilibrée,
            les Utilisateurs doivent se créer un compte via « Se connecter ». L’Utilisateur doit le faire en
            s’identifiant via ProConnect. Il devra y communiquer son nom, son prénom et son adresse e-mail
            professionnelle, ainsi que l’entreprise pour laquelle il effectue la déclaration.
          </p>
          <p>Outre les accès à la déclaration, les Utilisateurs ont accès au récapitulatif de la déclaration.</p>
          <h3>4.2 Index de l’égalité professionnelle entre les femmes et les hommes</h3>
          <p>
            Les Utilisateurs des entreprises d’au moins 50 salariés doivent transmettre, aux services du ministre chargé
            du travail, les résultats de l’index de l’égalité professionnelle et les informations complémentaires, en
            effectuant une déclaration.
          </p>
          <p>
            Tout Utilisateur peut, sans se créer de compte, utiliser le simulateur-calculateur disponible sur Egapro,
            afin d’obtenir automatiquement les résultats de l’index, après avoir saisi les données de son entreprise. A
            la suite des calculs, l’Utilisateur a la possibilité d’effectuer la déclaration.
          </p>
          <h3>4.3 Représentation équilibrée entre les femmes et les hommes dans les postes de direction</h3>
          <p>
            Les Utilisateurs des entreprises employant au moins 1000 salariés pour le troisième exercice consécutif
            doivent transmettre, aux services du ministre chargé du travail, les écarts éventuels de représentation
            parmi les cadres dirigeants et les membres des instances dirigeantes ainsi que les informations
            complémentaires en effectuant une déclaration.
          </p>
          <h3>4.4 Historique des déclarations</h3>
          <p>Chaque Utilisateur peut consulter l’historique de ses déclarations dans son espace.</p>
          <h3>4.5 Fonctionnalités ouvertes au public</h3>
          <p>
            Le Public peut consulter les résultats de l’index de l’égalité professionnelle et de la représentation
            équilibrée transmis par les entreprises sur le portail de consultation, en indiquant le numéro SIREN ou le
            nom de l’entreprise. Il peut aussi utiliser des filtres afin de sélectionner des entreprises selon la
            région, le département, le secteur d’activité. Le Public peut également télécharger le fichier contenant les
            résultats transmis par les entreprises.
          </p>
          <h2>Article 5 - Responsabilités</h2>
          <h3>5.1 L'Éditeur de la Plateforme</h3>
          <p>
            Les sources des informations diffusées sur Egapro sont réputées fiables mais la Plateforme ne garantit pas
            être exempte de défauts, d'erreurs ou d'omissions.
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
            préavis, la Plateforme pour des raisons de maintenance ou pour tout autre motif jugé nécessaire.
          </p>
          <p>
            La Plateforme peut mettre à disposition des liens pouvant orienter l'Utilisateur vers des sites gérés par
            des tiers extérieurs. Ces tiers sont les seuls responsables des contenus publiés. L'équipe de la Plateforme
            n'a aucun contrôle sur le contenu de ces sites, ces contenus ne sauraient engager la responsabilité de
            l'Éditeur.
          </p>
          <p>
            En cas de manquement à une ou plusieurs des stipulations des présentes CGU, l’Editeur se réserve le droit de
            suspendre ou de supprimer le compte de l’Utilisateur responsable.
          </p>
          <h3>5.2 L'Utilisateur</h3>
          <p>
            Toute information transmise par l'Utilisateur est de sa seule responsabilité. Il est rappelé que toute
            personne procédant à une fausse déclaration pour elle-même ou pour autrui s'expose, notamment, aux sanctions
            prévues à l'article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu'à trois ans
            d'emprisonnement et 45 000 euros d'amende.
          </p>
          <p>
            L'Utilisateur s'engage être titulaire d'un mandat ou d'une autorisation à réaliser la déclaration au nom et
            pour le compte de l'entreprise.
          </p>
          <p>
            L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou informations contraires aux dispositions
            légales et réglementaires en vigueur. Il veille notamment à ne pas communiquer de données sensibles ou de
            secrets protégés par la loi, et à ne pas publier de contenus illicites dans les zones de champs libres.
          </p>
          <h2>Article 6 - Mise à jour des conditions générales d'utilisation</h2>
          <p>
            Les termes des présentes conditions générales d'utilisation peuvent être amendés à tout moment, sans
            préavis, en fonction des modifications apportées à la Plateforme, de l'évolution de la législation ou pour
            tout autre motif jugé nécessaire.
          </p>
          <p>Chaque modification donne lieu à une nouvelle version qui est acceptée par les parties.</p>
          <p>Version du 05/10/2026</p>
          <p>
            <a href="/cgu/08022021">Version du 08/02/2021</a>
          </p>
          <p>
            <a href="/cgu/12102022">Version du 12/10/2022</a>
          </p>
          <p>
            <a href="/cgu/15032024">Version du 15/03/2024</a>
          </p>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default Cgu;
