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
            Egapro utilise le service d'identification MonComptePro afin de garantir l'appartenance de ses utilisateurs
            aux entreprises déclarantes.
          </p>

          <p>
            Vous devez ainsi vous identifier avec un compte MonComptePro pour déclarer votre index de l'égalité
            professionnelle, et le cas échéant vos écarts éventuels de représentation sur le site Egapro.
          </p>

          <p>
            Le compte utilisé doit correspondre à celui de la personne à contacter par les services de l'inspection du
            travail en cas de besoin. L'adresse email associée sera celle sur laquelle sera adressée l'accusé de
            réception en fin de déclaration.
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
              entreprises, vous pourrez ensuite rattacher les autres entreprises depuis votre compte, cf. partie&nbsp;5.
            </li>
            <li>
              Les tiers déclarants (comptables...) ne sont pas autorisés à déclarer pour le compte de leur entreprise
              cliente. Cette dernière doit créer son propre compte MonComptePro pour déclarer sur Egapro.
            </li>
          </ul>
          <Summary
            className="fr-my-6w"
            links={[
              {
                text: "Non réception des mails en provenance de MonComptePro",
                linkProps: {
                  href: "#non-reception-emails-moncomptepro",
                },
              },
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
            <AnchorLink as="h2" anchor="non-reception-emails-moncomptepro">
              Non réception des mails en provenance de MonComptePro
            </AnchorLink>
            <p>
              Vous ne recevez pas les mails en provenance de MonComptePro, vous êtes peut-être dans l’une de ces
              situations :
            </p>
            <ul>
              <li>
                Vous avez fait une erreur de saisie dans votre adresse email
                <br />
                💡{" "}
                <Link href="https://app.moncomptepro.beta.gouv.fr/users/start-sign-in" target="_blank">
                  Recréez un compte avec la bonne adresse
                </Link>
              </li>
              <li>
                Le mail est arrivé dans vos courriers indésirables
                <br />
                💡 Vérifiez vos spams
              </li>
              <li>
                Votre entreprise utilise une protection contre les spams (comme MailInBlack)
                <br />
                💡 Vous devez contacter votre service informatique pour qu'il autorise les mails en provenance de
                MonComptePro (adresse IP : 172.246.41.163)
              </li>
            </ul>
            <AnchorLink as="h2" anchor="Comment-contacter-MonComptePro">
              Comment contacter MonComptePro ?
            </AnchorLink>
            <p>
              Pour tout problème lié à MonComptePro, vous devez contacter le support dédié via cette adresse email{" "}
              <Link href={"mailto:contact@moncomptepro.beta.gouv.fr"} target="_blank" rel="noopener noreferrer">
                contact@moncomptepro.beta.gouv.fr
              </Link>
            </p>
            <AnchorLink as="h2" anchor="Comment-s-identifier-avec-MonComptePro">
              Comment s'identifier avec MonComptePro ?
            </AnchorLink>
            <AnchorLink as="h3" anchor="Vous-avez-un-compte-MonComptePro">
              Vous avez un compte MonComptePro
            </AnchorLink>
            <p>A la page "Connexion" du site Egapro, vous cliquez sur "S'identifier avec MonComptePro".</p>
            <p>
              Vous êtes redirigé sur le site MonComptePro à la page "S'inscrire ou se connecter". Vous saisissez votre
              adresse email professionnelle utilisée lors de la création du compte MonComptePro.
            </p>
            <p>
              A la page suivante, vous saisissez le mot de passe que vous avez créé (vous allez recevoir un code de
              vérification sur votre adresse email, attention ce code est à usage unique et il est valable 1 heure) ou
              vous cliquez pour recevoir un lien d'identification par mail (attention ce lien est à usage unique et il
              est valable 1 heure).
            </p>
            <p>Vous êtes ensuite redirigé sur le site Egapro.</p>
            <AnchorLink as="h3" anchor="Vous-n-avez-pas-encore-de-compte-MonComptePro">
              Vous n'avez pas encore de compte MonComptePro
            </AnchorLink>
            <p>
              À la page "Connexion" du site Egapro, vous cliquez sur "S'identifier avec MonComptePro". <br />
              Vous êtes redirigé sur le site MonComptePro à la page "S'inscrire ou se connecter". Vous saisissez votre
              adresse email professionnelle, celle-ci doit correspondre à la personne à contacter par les services de
              l'inspection du travail en cas de besoin.
            </p>
            <p>
              À la page suivante, vous pouvez soit choisir un mot de passe (vous allez recevoir un code de vérification
              sur votre adresse email, attention ce code est à usage unique et il est valable 1 heure), soit recevoir un
              lien de connexion sur votre adresse email (attention ce lien est à usage unique et il est valable 1
              heure).
            </p>
            <p>
              À la page suivante "Renseigner son identité", vous renseignez vos informations personnelles (nom, prénom,
              numéro de téléphone professionnel et fonction au sein de votre entreprise), permettant d'authentifier
              votre compte. Ces informations permettront également de préremplir les informations déclarant de la
              déclaration.
            </p>
            <p>
              À la page suivante "Votre organisation de rattachement", soit vous choisissez votre entreprise si une
              liste vous est proposée, soit vous saisissez le numéro Siret du siège social de votre entreprise.
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
                partie&nbsp;5.
              </li>
            </ul>
            <p>
              L'équipe MonComptePro procède à des traitements pour vérifier la légitimité du déclarant à représenter
              l'entreprise. Si l'équipe MonComptePro a déjà vérifié la correspondance entre votre entreprise et le nom
              de domaine de votre adresse email, votre compte sera validé automatiquement et vous serez redirigé sur le
              site Egapro.
              <br /> Sinon, l'équipe MonComptePro devra vérifier le rattachement de votre entreprise avant de valider
              votre compte, vous recevrez un mail dès que celui-ci sera effectif (un délai de un jour est à prévoir).
              Vous pourrez ensuite vous identifier avec votre compte MonComptePro sur le site Egapro.
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
              , puis en cliquant dans le menu sur "Informations personnelles".
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
            <p>Dans le menu, vous cliquez sur "Organisations" puis sur "+ Rejoindre une autre organisation".</p>
            <p>
              Vous saisissez ensuite le numéro Siret du siège social de l'entreprise dont vous souhaitez être rattachée.
            </p>
            <p>
              À noter que sur le site MonComptePro le rattachement d'une entreprise à votre compte s'effectue avec le
              numéro Siret du siège social de l'entreprise et sur le site Egapro c'est le numéro Siren de l'entreprise
              qui sera disponible pour effectuer la déclaration.
            </p>
            <p>
              L'équipe MonComptePro procède à des traitements pour vérifier la légitimité du déclarant à représenter
              l'entreprise. Si l'équipe MonComptePro a déjà vérifié la correspondance entre l'entreprise et le nom de
              domaine de votre adresse email, le rattachement sera validé automatiquement.
              <br /> Sinon, l'équipe MonComptePro procédera à une vérification avant de valider le rattachement, vous
              recevrez un mail dès que celui-ci sera effectif (un délai de un jour est à prévoir).
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
