/** @jsx jsx */
import { css, jsx } from "@emotion/core"

import Page from "../components/Page"

function CGU() {
  return (
    <Page title="Conditions d’utilisation d'Index Egapro">
      <div css={styles.content}>
        <p>
          Les présentes conditions générales d’utilisation (dites « CGU ») fixent le cadre juridique de la Plateforme
          Index Egapro et définissent les conditions d’accès et d’utilisation des services par l’Utilisateur.
        </p>
        <h2 css={styles.title}>Champ d’application</h2>
        <p>
          La Plateforme est d’accès libre et gratuit à tout Utilisateur. La simple visite de la Plateforme suppose
          l’acceptation par tout Utilisateur des présentes conditions générales d’utilisation.
          <br />
          <br />
          L’inscription sur la Plateforme peut entraîner l’application de conditions spécifiques, listées dans les
          présentes Conditions d’Utilisation
        </p>
        <h2 css={styles.title}>Objet</h2>
        <p>
          Index Egapro entend faire progresser au sein des entreprises l’égalité salariale entre les femmes et les
          hommes. Il permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les
          sexes et de mettre en évidence leurs points de progression.
        </p>
        <h2 css={styles.title}>Fonctionnalités</h2>
        <p>
          Index Egapro a mis en place un simulateur en ligne grâce auquel tout utilisateur, sans se créer de compte,
          peut remplir des informations concernant son entreprise afin de calculer son Index et connaître les écarts de
          salaire entre hommes et femmes au sein de sa structure. Dans le cadre du remplissage de ce formulaire,
          l’utilisateur a la possibilité de renseigner son adresse email afin d’enregistrer les données fournies et de
          continuer son calcul et sa déclaration plus tard.
          <br />
          <br />
          Index Egapro propose également un formulaire de déclaration de cet Index afin qu’il soit transmis au Ministère
          du Travail. La plateforme propose également une FAQ et un moteur de recherche. Le code du logiciel est libre,
          et peut donc être vérifié et amélioré par tous :{" "}
          <a href="https://github.com/SocialGouv/egapro/">https://github.com/SocialGouv/egapro/</a>
        </p>
        <h2 css={styles.title}>Responsabilités</h2>
        <h3 css={styles.subtitle}>Index Egapro</h3>
        <p>
          Les sources des informations diffusées sur la Plateforme sont réputées fiables mais le site ne garantit pas
          qu’il soit exempt de défauts, d’erreurs ou d’omissions.
          <br />
          <br />
          Tout événement dû à un cas de force majeure ayant pour conséquence un dysfonctionnement de la Plateforme et
          sous réserve de toute interruption ou modification en cas de maintenance, n'engage pas la responsabilité de
          Index Egapro.
          <br />
          <br />
          L’éditeur s’engage à mettre en œuvre toutes mesures appropriées, afin de protéger les données traitées.
          <br />
          <br />
          L’éditeur s’engage à la sécurisation de la Plateforme, notamment en prenant toutes les mesures nécessaires
          permettant de garantir la sécurité et la confidentialité des informations fournies.
          <br />
          <br />
          L’éditeur fournit les moyens nécessaires et raisonnables pour assurer un accès continu, sans contrepartie
          financière, à la Plateforme. Il se réserve la liberté de faire évoluer, de modifier ou de suspendre, sans
          préavis, la plateforme pour des raisons de maintenance ou pour tout autre motif jugé nécessaire.
          <br />
          <br />
          Ce site peut mettre à disposition des liens pouvant orienter l’utilisateur vers des sites réalisés par des
          tiers extérieurs. Ces tiers sont les seuls responsables du contenu publié par leur soin. L’équipe n’a aucun
          contrôle sur le contenu de ces sites, ces contenus ne sauraient engager la responsabilité de l’administration.
        </p>
        <h3 css={styles.subtitle}>L'Utilisateur</h3>
        <p>
          Toute information transmise par l'Utilisateur est de sa seule responsabilité. Il est rappelé que toute
          personne procédant à une fausse déclaration pour elle-même ou pour autrui s’expose, notamment, aux sanctions
          prévues à l’article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu’à trois ans d’emprisonnement
          et 45 000 euros d’amende.
          <br />
          <br />
          L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou informations contraires aux dispositions
          légales et réglementaires en vigueur.
          <br />
          <br />
          Le contenu de l'Utilisateur peut être à tout moment et pour n'importe quelle raison supprimé ou modifié par le
          site, sans préavis.
        </p>
        <h2 css={styles.title}>Mise à jour des conditions d’utilisation</h2>
        <p>
          Les termes des présentes conditions d’utilisation peuvent être amendés à tout moment, sans préavis, en
          fonction des modifications apportées à la plateforme, de l’évolution de la législation ou pour tout autre
          motif jugé nécessaire.
        </p>
      </div>
    </Page>
  )
}

const styles = {
  content: css({}),
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    fontWeight: "bold",
    marginTop: 30,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 20,
  }),
  subtitle: css({
    fontSize: 16,
    lineHeight: "22px",
    fontWeight: "bold",
    marginTop: 20,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 10,
  }),
}

export default CGU
