import { Container, Grid, GridCol } from "@design-system";
import Link from "next/link";

const title = "Conditions d’utilisation";
const description =
  "Les présentes conditions générales d’utilisation (dites «CGU») fixent le cadre juridique de la Plateforme EgaPro et définissent les conditions d’accès et d’utilisation des services par l’Utilisateur.";

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
          <p>
            Les présentes conditions générales d’utilisation (dites «CGU») fixent le cadre juridique de la Plateforme
            EgaPro et définissent les conditions d’accès et d’utilisation des services par l’Utilisateur.
          </p>
          <h2>Champ d’application</h2>
          <p>
            La Plateforme est d’accès libre et gratuit à tout Utilisateur. La simple visite de la Plateforme suppose
            l’acceptation par tout Utilisateur des présentes conditions générales d’utilisation.
          </p>
          <p>
            L’inscription sur la Plateforme peut entraîner l’application de conditions spécifiques, listées dans les
            présentes Conditions d’Utilisation.
          </p>
          <h2>Objet</h2>
          <p>EgaPro met en place deux index conçus pour lutter contre l’inégalité entre les femmes et les hommes.</p>
          <p>
            Le premier Index Egapro est un outil de calcul et de déclaration visant à faire progresser au sein des
            entreprises l’égalité salariale entre les femmes et les hommes. Il permet aux entreprises de mesurer, en
            toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de
            progression
          </p>
          <p>
            Le second Index Egapro est un outil visant à faire progresser au sein des entreprises l’égalité
            professionnelle et la représentation équilibrée femmes-hommes dans les services dirigeants. Il permet aux
            entreprises de mesurer, en toute transparence, les écarts de représentation dans les services dirigeants et
            de mettre en évidence leurs points de progression.
          </p>
          <h2>Fonctionnalités</h2>
          <h3 className="fr-text--xl">Index EgaPro sur l’égalité professionnelle</h3>
          <p>
            EgaPro a mis en place un simulateur en ligne grâce auquel tout utilisateur, sans se créer de compte, peut
            remplir des informations concernant son entreprise afin de calculer son Index et de connaître les écarts de
            salaire entre hommes et femmes au sein de sa structure. Dans le cadre du remplissage de ce formulaire,
            l’utilisateur a la possibilité de renseigner son adresse email afin d’enregistrer les données fournies et de
            remplir sa déclaration plus tard.
          </p>
          <p>
            EgaPro propose également un formulaire de déclaration de cet Index afin qu’il soit transmis au Ministère du
            Travail.
          </p>
          <p>La plateforme propose également une FAQ et un moteur de recherche.</p>
          <h3 className="fr-text--xl">
            Index EgaPro sur la représentation équilibrée entre hommes et femmes au sein des postes dirigeants des
            grandes entreprises
          </h3>
          <p>
            EgaPro a mis en place une déclaration sur la représentation équilibrée afin qu’elle soit transmise au
            Ministère du Travail. Tout utilisateur, sans se créer de compte, peut remplir des informations le
            concernant, des informations concernant son entreprise en prenant en compte la période de référence, les
            écarts de représentation. Le déclarant renseigne son nom, prénom, son adresse e-mail, son numéro de
            téléphone mais également le numéro Siren de son entreprise afin de réaliser sa déclaration concernant la
            représentation équilibrée.
          </p>
          <p>
            Le code du logiciel est libre, et peut donc être vérifié et amélioré par tous&nbsp;:{" "}
            <Link href="https://egapro.travail.gouv.fr/">https://egapro.travail.gouv.fr/</Link>
          </p>
          <h2>Responsabilités</h2>
          <h3 className="fr-text--xl">EgaPro</h3>
          <p>
            Les sources des informations diffusées sur la Plateforme sont réputées fiables mais le site ne garantit pas
            qu’il soit exempt de défauts, d’erreurs ou d’omissions.
          </p>
          <p>
            Tout événement dû à un cas de force majeure ayant pour conséquence un dysfonctionnement de la Plateforme et
            sous réserve de toute interruption ou modification en cas de maintenance, n'engage pas la responsabilité de
            EgaPro.
          </p>
          <p>L’éditeur s’engage à mettre en œuvre toutes mesures appropriées, afin de protéger les données traitées.</p>
          <p>
            L’éditeur s’engage à la sécurisation de la Plateforme, notamment en prenant toutes les mesures nécessaires
            permettant de garantir la sécurité et la confidentialité des informations fournies.
          </p>
          <p>
            L’éditeur fournit les moyens nécessaires et raisonnables pour assurer un accès continu, sans contrepartie
            financière, à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou de suspendre, sans
            préavis, la plateforme pour des raisons de maintenance ou pour tout autre motif jugé nécessaire.
          </p>
          <p>
            Ce site peut mettre à disposition des liens pouvant orienter l’utilisateur vers des sites réalisés par des
            tiers extérieurs. Ces tiers sont les seuls responsables du contenu publié par leur soin. L’équipe n’a aucun
            contrôle sur le contenu de ces sites, ces contenus ne sauraient engager la responsabilité de
            l’administration.
          </p>
          <h3 className="fr-text--xl">L’Utilisateur</h3>
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
            le site, sans préavis.
          </p>
          <h2>Mise à jour des conditions d’utilisation</h2>
          <p>
            Les termes des présentes conditions d’utilisation peuvent être amendés à tout moment, sans préavis, en
            fonction des modifications apportées à la plateforme, de l’évolution de la législation ou pour tout autre
            motif jugé nécessaire.
          </p>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default Cgu;
