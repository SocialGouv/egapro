import Summary from "@codegouvfr/react-dsfr/Summary";
import { config } from "@common/config";
import { Container, ContentWithChapter, Grid, GridCol } from "@design-system";
import { AnchorLink } from "@design-system/client";
import Link from "next/link";

const title = "Aide pour l'utilisation du service d'identification ProConnect";

export const metadata = {
  title,
  openGraph: { title },
};

const proconnectSignInUrl = config.proconnect.signinUrl;

const AideProConnectPage = () => (
  <Container py="8w">
    <Grid align="center">
      <GridCol md={10} lg={8}>
        <h1>{title}</h1>
        <p>
          Egapro utilise le service d'identification ProConnect afin de garantir l'appartenance de ses utilisateurs aux
          entreprises déclarantes.
        </p>
        <p>
          Vous devez ainsi vous identifier avec un compte ProConnect pour déclarer votre index de l'égalité
          professionnelle, et le cas échéant vos écarts éventuels de représentation sur le portail Egapro.
        </p>
        <p>
          Le compte utilisé doit correspondre à celui de la personne à contacter par les services de l'inspection du
          travail en cas de besoin. L'adresse e-mail associée sera celle sur laquelle sera adressé l'accusé de réception
          en fin de déclaration.
        </p>
        <p>
          En cas de déclaration de l'index de l'égalité professionnelle au niveau d'une unité économique et sociale
          (UES), un seul compte doit être créé. Il doit appartenir à l'entreprise qui effectue la démarche pour le
          compte de l'UES. Pour assurer la continuité, cette entreprise doit être la même que les années précédentes,
          sauf si elle a fermé ou quitté l'UES.
        </p>
        <p>
          Les tiers déclarants (comptables...) ne sont pas autorisés à déclarer pour le compte de leur entreprise
          cliente. Cette dernière doit créer son propre compte ProConnect pour déclarer sur Egapro.
        </p>

        <Summary
          className="fr-my-6w"
          links={[
            {
              text: "Non-réception des e-mails en provenance de ProConnect",
              linkProps: { href: "#non-reception-emails-moncomptepro" },
            },
            { text: "Comment contacter ProConnect ?", linkProps: { href: "#Comment-contacter-ProConnect" } },
            {
              text: "Comment s'identifier avec ProConnect ?",
              linkProps: { href: "#Comment-s-identifier-avec-ProConnect" },
            },
            {
              text: "Comment modifier mes informations personnelles sur ProConnect ?",
              linkProps: { href: "#Comment-modifier-mes-informations-personnelles-sur-ProConnect" },
            },
            {
              text: "Comment rattacher une nouvelle entreprise à mon compte ProConnect ?",
              linkProps: { href: "#Comment-rattacher-une-nouvelle-entreprise-à-mon-compte-ProConnect" },
            },
          ]}
        />

        <ContentWithChapter>
          <AnchorLink as="h2" anchor="non-reception-emails-moncomptepro">
            Non-réception des e-mails en provenance de ProConnect
          </AnchorLink>
          <p>
            Vous ne recevez pas les e-mails en provenance de ProConnect, vous êtes peut-être dans l'une de ces
            situations :
          </p>
          <ul>
            <li className="fr-mb-2w">
              Vous avez fait une erreur de saisie dans votre adresse e-mail
              <br />
              💡 <Link href="/login">Recréez un compte avec la bonne adresse</Link>
            </li>
            <li className="fr-mb-2w">
              L'e-mail est arrivé dans vos courriers indésirables
              <br />
              💡 Vérifiez vos spams
            </li>
            <li>
              Votre entreprise utilise une protection contre les spams (comme MailInBlack ou Altospam)
              <br />
              💡 Vous devez contacter votre service informatique pour qu'il autorise les e-mails en provenance de{" "}
              <Link href="mailto:no-reply@account.proconnect.gouv.fr">no-reply@account.proconnect.gouv.fr</Link>{" "}
              (adresse IP : 213.32.191.190). Puis demandez-lui de paramétrer le filtre antispam pour laisser passer les
              e-mails ProConnect.
            </li>
          </ul>

          <AnchorLink as="h2" anchor="Comment-contacter-ProConnect">
            Comment contacter ProConnect ?
          </AnchorLink>
          <p>
            Pour tout problème lié à ProConnect (création de compte, rattachement d'une entreprise, non-réception du
            code de confirmation, etc.), vous devez contacter le support dédié via le{" "}
            <Link href="https://proconnect.crisp.help/fr/" target="_blank" rel="noopener noreferrer">
              Centre d'aide
            </Link>
            .
          </p>

          <AnchorLink as="h2" anchor="Comment-s-identifier-avec-ProConnect">
            Comment s'identifier avec ProConnect ?
          </AnchorLink>
          <AnchorLink as="h3" anchor="Vous-avez-un-compte-ProConnect">
            Vous avez un compte ProConnect
          </AnchorLink>
          <p>Sur le portail Egapro, vous cliquez sur « Se connecter » en haut à droite de la page.</p>
          <p>À la page « Connexion », vous cliquez sur « S'identifier avec ProConnect ».</p>
          <p>
            Vous êtes redirigé sur le portail ProConnect à la page « Se connecter ou s'inscrire à egapro ». Vous
            saisissez votre adresse e-mail professionnelle utilisée lors de la création du compte ProConnect.
          </p>
          <p>
            À la page suivante, vous saisissez le mot de passe que vous avez créé (vous allez recevoir un code de
            confirmation sur votre adresse e-mail, attention ce code est à usage unique et il est valable 1 heure) ou
            vous cliquez pour recevoir un lien de connexion par e-mail (attention ce lien est à usage unique et il est
            valable 1 heure).
          </p>
          <p>Vous êtes ensuite redirigé sur le portail Egapro.</p>

          <AnchorLink as="h3" anchor="Vous-n-avez-pas-encore-de-compte-ProConnect">
            Vous n'avez pas encore de compte ProConnect
          </AnchorLink>
          <p>Sur le portail Egapro, vous cliquez sur « Se connecter » en haut à droite de la page.</p>
          <p>À la page « Connexion », vous cliquez sur « S'identifier avec ProConnect ».</p>
          <p>
            Vous êtes redirigé sur le portail ProConnect à la page « Se connecter ou s'inscrire à egapro ». Vous
            saisissez votre adresse e-mail professionnelle, celle-ci doit correspondre à la personne à contacter par les
            services de l'inspection du travail en cas de besoin.
          </p>
          <p>
            À la page suivante, vous pouvez soit choisir un mot de passe (vous allez recevoir un code de confirmation
            sur votre adresse e-mail, attention ce code est à usage unique et il est valable 1 heure), soit recevoir un
            lien de connexion sur votre adresse e-mail (attention ce lien est à usage unique et il est valable 1 heure).
          </p>
          <p>
            À la page suivante « Rejoindre votre organisation », soit vous choisissez votre entreprise si une liste vous
            est proposée, soit vous saisissez le numéro Siret du siège social de votre entreprise.
          </p>
          <p>
            Notez que la création et le rattachement de votre compte sur le portail ProConnect nécessitent le numéro
            SIRET du siège social de votre entreprise. En revanche, sur le portail Egapro, c'est le numéro SIREN qui
            sera automatiquement utilisé pour réaliser la déclaration.
          </p>
          <p>
            Attention : en cas de déclaration de l'index de l'égalité professionnelle au niveau d'une unité économique
            et sociale (UES), un seul compte doit être créé. Il doit appartenir à l'entreprise qui effectue la démarche
            pour le compte de l'UES. Pour assurer la continuité, cette entreprise doit être la même que les années
            précédentes, sauf si elle a fermé ou quitté l'UES.
          </p>
          <p>
            À la page suivante « Renseigner son identité », vous renseignez vos informations personnelles (nom, prénom,
            numéro de téléphone professionnel et fonction au sein de votre entreprise), permettant d'authentifier votre
            compte. Ces informations permettront également de préremplir les informations déclarant de la déclaration.
          </p>
          <p>Votre compte est créé et vous êtes redirigé sur le portail Egapro.</p>
          <p>
            L'équipe ProConnect effectue parfois des vérifications avant d'activer un compte. Si c'est le cas pour le
            vôtre, un délai moyen d'un jour est à prévoir. Vous recevrez un e-mail dès que votre compte sera actif pour
            vous connecter au portail Egapro.
          </p>
          <p>
            Votre demande de création de compte peut être refusée si l'équipe ProConnect juge que vous n'êtes pas
            habilité à représenter cette entreprise. Si cela se produit, nous vous invitons à contacter le support
            ProConnect pour réexaminer votre situation (cf. point 2).
          </p>

          <AnchorLink as="h2" anchor="Comment-modifier-mes-informations-personnelles-sur-ProConnect">
            Comment modifier mes informations personnelles sur ProConnect ?
          </AnchorLink>
          <p>
            Vous pouvez modifier vos informations personnelles (nom, prénom, numéro de téléphone professionnel et
            fonction au sein de votre entreprise) en vous connectant à votre compte sur le portail{" "}
            <Link href={proconnectSignInUrl} target="_blank" rel="noopener noreferrer">
              ProConnect
            </Link>
            , puis en cliquant dans le menu sur « Info personnelles ».
          </p>
          <p>
            L'adresse e-mail associée à votre compte ne peut pas être modifiée. Si vous souhaitez utiliser une autre
            adresse, vous devez créer un nouveau compte ProConnect.
          </p>

          <AnchorLink as="h2" anchor="Comment-rattacher-une-nouvelle-entreprise-à-mon-compte-ProConnect">
            Comment rattacher une nouvelle entreprise à mon compte ProConnect ?
          </AnchorLink>
          <p>
            Vous vous connectez à votre compte sur le portail{" "}
            <Link href={proconnectSignInUrl} target="_blank" rel="noopener noreferrer">
              ProConnect
            </Link>
            .
          </p>
          <p>Dans le menu, vous cliquez sur « Organisations » puis sur « + Rejoindre une autre organisation ».</p>
          <p>
            Vous saisissez ensuite le numéro Siret du siège social de l'entreprise dont vous souhaitez être rattachée.
          </p>
          <p>
            Notez que le rattachement à votre compte ProConnect nécessite le numéro SIRET du siège social de
            l'entreprise. En revanche, sur le portail Egapro, c'est le numéro SIREN qui sera automatiquement utilisé
            pour réaliser la déclaration.
          </p>
          <p>
            L'équipe ProConnect peut effectuer une vérification avant de valider votre rattachement. Si c'est le cas,
            comptez un délai moyen de 24 heures. Un e-mail vous sera envoyé dès que le rattachement sera effectif.
          </p>
          <p>
            Votre demande de rattachement peut être refusée si l'équipe ProConnect juge que vous n'êtes pas habilité à
            représenter cette entreprise. Si cela se produit, nous vous invitons à contacter le support ProConnect pour
            réexaminer votre situation (cf. point 2).
          </p>
          <p>
            Attention : si vous êtes déjà connecté pour une entreprise sur le portail Egapro et souhaitez en changer,
            vous devez vous déconnecter puis vous reconnecter pour sélectionner la nouvelle entité.
          </p>
          <p>
            À l'avenir, il ne sera plus possible de rattacher plusieurs entreprises à un seul compte ProConnect. Chaque
            entreprise devra obligatoirement créer son propre compte.
          </p>
        </ContentWithChapter>
      </GridCol>
    </Grid>
  </Container>
);

export default AideProConnectPage;
