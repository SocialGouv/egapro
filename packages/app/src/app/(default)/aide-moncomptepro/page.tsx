import Summary from "@codegouvfr/react-dsfr/Summary";
import { Container, ContentWithChapter, Grid, GridCol } from "@design-system";
import { AnchorLink } from "@design-system/client";
import Link from "next/link";

const title = "Aide pour l'utilisation du service d'identification MonComptePro";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const AideMonCompteProPage = () => {
  return (
    <Container py="8w">
      <Grid align="center">
        <GridCol md={10} lg={8}>
          <h1>{title}</h1>
          <p>
            Afin de simplifier et sécuriser votre parcours, Egapro utilise le service d'identification MonComptePro afin
            de garantir l'appartenance de ses utilisateurs aux entreprises déclarantes.
          </p>

          <p>
            Vous devez ainsi créer un compte MonComptePro pour déclarer votre index de l'égalité professionnelle, et le
            cas échéant vos écarts éventuels de représentation équilibrée sur le site Egapro.
          </p>

          <p>
            Le compte utilisé doit correspondre à celui de la personne à contacter par les services de l'inspection du
            travail en cas de besoin. L'email associé sera celui sur lequel sera adressé l'accusé de réception en fin de
            déclaration.
          </p>
          <p>À noter :</p>
          <ul>
            <li>
              Si vous déclarez votre index de l'égalité professionnelle en tant qu'unité économique et sociale (UES),
              vous devez créer un compte uniquement pour l'entreprise déclarant pour le compte de l'UES, qui doit être
              celle ayant effectué la déclaration les années précédentes.
            </li>
            <li>
              Si vous déclarez pour le compte de plusieurs entreprises, vous devez créer un seul compte pour une des
              entreprises, vous pourrez ensuite rattacher les autres entreprises depuis votre compte, cf. partie&nbsp;3.
            </li>
          </ul>
          <Summary
            className="fr-my-6w"
            links={[
              {
                text: "Comment contacter MonComptePro ?",
                linkProps: {
                  href: "#Comment-contacter-MonComptePro",
                },
              },
              {
                text: "Comment s'identifier avec MonComptePro ?",
                linkProps: {
                  href: "#Comment-s-identifier-avec-MonComptePro",
                },
              },
              {
                text: "Comment modifier mes informations personnelles sur MonComptePro ?",
                linkProps: {
                  href: "#Comment-modifier-mes-informations-personnelles-sur-MonComptePro",
                },
              },
              {
                text: "Comment rattacher une nouvelle entreprise à mon compte MonComptePro ?",
                linkProps: {
                  href: "#Comment-rattacher-une-nouvelle-entreprise-à-mon-compte-MonComptePro",
                },
              },
            ]}
          />

          <ContentWithChapter>
            <AnchorLink as="h2" anchor="Comment-contacter-MonComptePro">
              Comment contacter MonComptePro ?
            </AnchorLink>
            <p>
              Pour tout problème lié à la connexion sur votre espace MonComptePro, veuillez consulter le support{" "}
              <Link href={"mailto:contact@moncomptepro.beta.gouv.fr"} target="_blank" rel="noopener noreferrer">
                contact@moncomptepro.beta.gouv.fr
              </Link>
            </p>
            <AnchorLink as="h2" anchor="Comment-s-identifier-avec-MonComptePro">
              Comment s'identifier avec MonComptePro ?
            </AnchorLink>
            <p>
              À la page "Connexion" du formulaire de déclaration, vous cliquez sur "S'identifier avec MonComptePro".
            </p>
            <p>
              Vous êtes redirigé sur le site MonComptePro, à la page "S'inscrire ou se connecter". Vous saisissez votre
              email.
            </p>
            <AnchorLink as="h3" anchor="Vous-avez-un-compte-MonComptePro">
              Vous avez un compte MonComptePro
            </AnchorLink>
            <p>
              Vous y accédez soit en saisissant le mot de passe que vous avez créé soit en recevant un lien de connexion
              par mail (attention ce lien est à usage unique).
            </p>
            <p>Vous êtes ensuite redirigé sur le site Egapro.</p>
            <AnchorLink as="h3" anchor="Vous-n-avez-pas-encore-de-compte-MonComptePro">
              Vous n'avez pas encore de compte MonComptePro
            </AnchorLink>
            <p>
              À la page suivante, vous pouvez soit choisir un mot de passe (vous allez recevoir un code de vérification
              sur votre email pour le vérifier), soit recevoir un lien de connexion sur votre email (attention ce lien
              est à usage unique).
            </p>
            <p>
              À la page suivante "Renseigner son identité", vous renseignez vos informations personnelles (nom, prénom,
              numéro de téléphone professionnel et fonction au sein de votre entreprise), permettant d'authentifier
              votre compte. Ces informations permettront également de préremplir les informations déclarant de la
              déclaration.
            </p>
            <p>
              À la page suivante "Votre organisation de rattachement", soit vous choisissez votre entreprise si une
              liste vous est proposée, soit vous saisissez le numéro Siret du siège social de votre entreprise, puis
              vous cliquez sur "Enregistrer".
            </p>
            <p>
              À noter que sur le site MonComptePro le rattachement de votre compte s'effectue avec le numéro Siret du
              siège social de votre entreprise et sur le site Egapro c'est le numéro Siren de votre entreprise qui sera
              disponible pour effectuer votre déclaration.
            </p>
            <p>Attention :</p>
            <ul>
              <li>
                Si vous déclarez votre index de l'égalité professionnelle en tant qu'unité économique et sociale (UES),
                vous devez créer un compte uniquement pour l'entreprise déclarant pour le compte de l'UES, qui doit être
                celle ayant effectué la déclaration les années précédentes.
              </li>
              <li>
                Si vous déclarez pour le compte de plusieurs entreprises, vous devez créer un seul compte pour une des
                entreprises, vous pourrez ensuite rattacher les autres entreprises depuis votre compte, cf.
                partie&nbsp;3.
              </li>
            </ul>
            <p>
              Si le nom de domaine de votre email a déjà été vérifié par l'équipe MonComptePro, votre compte sera validé
              automatiquement. Sinon, l'équipe MonComptePro devra vérifier votre rattachement avant de valider votre
              compte, vous recevrez un mail dès que celui-ci sera effectif (un délai de un jour et à prévoir).
            </p>
            <AnchorLink as="h2" anchor="Comment-modifier-mes-informations-personnelles-sur-MonComptePro">
              Comment modifier mes informations personnelles sur MonComptePro ?
            </AnchorLink>
            <p>
              Vous pouvez modifier vos informations personnelles (nom, prénom, numéro de téléphone professionnel et
              fonction au sein de votre entreprise) en vous connectant à votre compte sur le site MonComptePro,{" "}
              <Link href={"https://moncomptepro.beta.gouv.fr/"} target="_blank" rel="noopener noreferrer">
                https://moncomptepro.beta.gouv.fr/
              </Link>
              , puis dans le menu "Vos informations personnelles".
            </p>
            <p>
              À noter que vous ne pouvez pas modifier l’email associé à votre compte. Si vous souhaitez utiliser un
              autre email, vous devez créer un nouveau compte MonComptePro.
            </p>
            <AnchorLink as="h2" anchor="Comment-rattacher-une-nouvelle-entreprise-à-mon-compte-MonComptePro">
              Comment rattacher une nouvelle entreprise à mon compte MonComptePro ?
            </AnchorLink>
            <p>
              Vous vous connectez à votre compte sur le site MonComptePro,
              <br />
              <Link href={"https://moncomptepro.beta.gouv.fr/"} target="_blank" rel="noopener noreferrer">
                https://moncomptepro.beta.gouv.fr/
              </Link>
              .
            </p>
            <p>
              Au menu "Votre organisation", vous pouvez ajouter une autre entreprise, en cliquant sur "+ Rejoindre une
              autre organisation".
            </p>
            <p>
              Vous saisissez le numéro Siret du siège social de l'entreprise dont vous souhaitez être rattachée, puis
              vous cliquez sur "Enregistrer".
            </p>
            <p>
              À noter que sur le site MonComptePro le rattachement de votre compte s'effectue avec le numéro Siret du
              siège social et sur le site Egapro c'est le numéro Siren de l'entreprise qui sera disponible pour
              effectuer votre déclaration.
            </p>
            <p>
              L'équipe MonComptePro devra vérifier votre rattachement avant de le valider, vous recevrez un mail dès que
              celui-ci sera effectif (un délai de un jour et à prévoir).
            </p>
            <p>
              <b>
                Si le rattachement a été validé par l'équipe MonComptePro et que sur le site Egapro vous n'avez pas le
                numéro Siren de l'entreprise dans la liste déroulante de la page "Commencer" de la déclaration, il
                convient de vous déconnecter du site Egapro en haut à droite de la page et de vous reconnecter.
              </b>
            </p>
          </ContentWithChapter>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default AideMonCompteProPage;
