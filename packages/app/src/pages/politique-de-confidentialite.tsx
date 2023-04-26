import { Button } from "@codegouvfr/react-dsfr/Button";
import { BasicLayoutPublic } from "@components/layouts/BasicLayoutPublic";
import { Container, Grid, GridCol } from "@design-system";

import { useGdprStore } from "../design-system/base/custom/ConsentBanner";
import { NextLinkOrA } from "../design-system/utils/NextLinkOrA";
import { type NextPageWithLayout } from "./_app";

const PrivacyPolicy: NextPageWithLayout = () => {
  const consentModalButtonProps = useGdprStore(state => state.consentModalButtonProps);
  return (
    <section>
      <Container py="8w">
        <Grid justifyCenter>
          <GridCol md={10} lg={8}>
            <h1>Protection des données à caractère personnel – Index Egapro</h1>
            <h2>Responsable de traitements</h2>
            <p>
              Le responsable de traitements est la Direction Générale du Travail, représentée par Monsieur Pierre
              Ramain, Directeur Général du Travail.
            </p>
            <h2>Données personnelles traitées</h2>
            <p>La présente Plateforme traite les données personnelles suivantes&nbsp;:</p>
            <ul>
              <li>
                Pour les utilisateurs de l’Index Egapro concernant les inégalités salariales&nbsp;: nom, prénom, numéro
                de téléphone, adresse e-mail.
              </li>
              <li>
                Pour les utilisateurs de l’Index Egapro concernant la représentation équilibrée femmes-hommes dans les
                services dirigeants&nbsp;: nom, prénom, numéro de téléphone, adresse e-mail.
              </li>
            </ul>
            <h2>Finalités</h2>
            <p>
              Ces données sont nécessaires et proportionnées pour la réalisation de la mission de la Plateforme. Elles
              visent à calculer les écarts de rémunération femmes-hommes au sein des entreprises, et à réaliser les
              déclarations qui en sont issues tout comme les écarts de représentation équilibrée entre les femmes et les
              hommes dans les services dirigeants.
            </p>
            <h2>Base juridique des traitements de données</h2>
            <p>
              Conformément aux dispositions de l’article 6-e du Règlement relatif à la protection des données (appelé
              RGPD), le traitement est nécessaire à l’exécution d’une mission d’intérêt public ou relève de l’exercice
              de l’autorité publique dont est investi le Responsable de traitement.{" "}
            </p>
            <p>
              Cette mission est figure à l’article 2 de l’arrêté du 4 juillet 2022 relatif à la direction générale du
              travail.
            </p>
            <h2>Durée de conservation</h2>
            <p>
              Pour les données des utilisateurs des deux Index EgaPro&nbsp;: temps nécessaire au traitement de la
              demande, sans excéder 3 mois.
            </p>
            <p>
              Passés ces délais de conservation, les responsables de traitement s’engagent à supprimer définitivement
              les données des personnes concernées.
            </p>
            <h2>Sécurité et confidentialité</h2>
            <p>
              Les données personnelles sont traitées dans des conditions sécurisées, selon les moyens actuels de la
              technique, dans le respect des dispositions relatives à la protection de la vie privée et notamment au
              référentiel général de sécurité, prévu à l’article 9 de l’ordonnance 2005-1516 du 8 décembre 2005 relative
              aux échanges électroniques entre les usagers et les autorités administratives et entre les autorités
              administratives.
            </p>
            <p>Les moyens de sécurisation suivants ont notamment été mis en oeuvre&nbsp;:</p>
            <ul className="fr-mb-3w">
              <li>Pare feu système&nbsp;;</li>
              <li>Pare feu applicatif (WAF)&nbsp;;</li>
              <li>Chiffrement des flux reseaux via certificat SSL&nbsp;;</li>
              <li>Disque dur chiffré&nbsp;;</li>
              <li>Services isolés dans des containers&nbsp;;</li>
              <li>Gestion des journaux&nbsp;;</li>
              <li>Monitoring Azur&nbsp;;</li>
              <li>Administration et monitoring centralisés des accès&nbsp;;</li>
              <li>Accès aux ressources via clés SSH (pas de mot de passe post installation)&nbsp;;</li>
              <li>Sauvegarde des bases de données via solution de stockage Azur&nbsp;;</li>
              <li>
                Accès aux données réservé aux membres de l'entité (hors restitution applicative publique des
                données)&nbsp;;
              </li>
              <li>
                Accès aux données uniquement via un outil d'édition sécurisé (SSL + mot de passe) avec utilisation de
                comptes nominatifs.
              </li>
            </ul>
            <h2>Droits des personnes concernées</h2>
            <p>
              Vous disposez des droits suivants concernant vos données à caractère personnel en tant
              qu’utilisateurs&nbsp;:
            </p>
            <ul>
              <li>Droit d’information, d’accès et de communication des données&nbsp;;</li>
              <li>Droit de rectification et le cas échéant de suppression des données&nbsp;;</li>
              <li>Droit d’opposition au traitement de données, le cas échéant.</li>
            </ul>
            <p>Vous disposez des droits suivants concernant vos données de connexion&nbsp;:</p>
            <ul>
              <li>Droit d’information et droit d’accès&nbsp;;</li>
              <li>Droit de rectification.</li>
            </ul>
            <p>
              Vous pouvez exercer ces droits en écrivant à{" "}
              <NextLinkOrA isExternal href="mailto:index@travail.gouv.fr">
                index@travail.gouv.fr
              </NextLinkOrA>
              .
            </p>
            <p>
              En raison de l’obligation de sécurité et de confidentialité dans le traitement des données à caractère
              personnel qui incombe à Index Egapro, votre demande sera uniquement traitée si vous rapportez la preuve de
              votre identité. Pour vous aider dans votre démarche, vous trouverez{" "}
              <NextLinkOrA
                isExternal
                href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces"
                target="_blank"
                rel="noreferrer"
              >
                ici
              </NextLinkOrA>{" "}
              un modèle de courrier élaboré par la Cnil.
            </p>
            <p>
              Vous avez la possibilité de vous opposer à un traitement de vos données personnelles. Pour vous aider dans
              votre démarche, vous trouverez ici un modèle de courrier élaboré par la Cnil.
            </p>
            <h3 className="fr-text--xl">Délais de réponse</h3>
            <p>
              Le responsable de traitement s’engage à répondre à votre demande d’accès, de rectification ou d’opposition
              ou toute autre demande complémentaire d’informations dans un délai raisonnable qui ne saurait dépasser 1
              mois à compter de la réception de votre demande.
            </p>
            <h3 className="fr-text--xl">Destinataires</h3>
            <p>
              Les données collectées et les demandes, ou dossiers réalisés depuis la Plateforme sont traitées par les
              seules personnes juridiquement habilitées à connaître des informations traitées.
            </p>
            <p>
              Le responsable de traitement veille à ne fournir des accès qu’aux seules personnes juridiquement
              habilitées à connaître des informations traitées.
            </p>
            <h2>Sous-traitants</h2>
            <p>
              Certaines des données sont envoyées à des sous-traitants pour réaliser certaines missions. Les
              responsables de traitement se sont assurés de la mise en œuvre par ses sous-traitants de garanties
              adéquates et du respect de conditions strictes de confidentialité, d’usage et de protection des données.
            </p>
            <div className="fr-table fr-table--bordered">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Partenaire</th>
                    <th scope="col">Pays destinataire</th>
                    <th scope="col">Traitement réalisé</th>
                    <th scope="col">Garanties</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Microsoft Azure</td>
                    <td>France</td>
                    <td>Hébergement</td>
                    <td>
                      <NextLinkOrA
                        isExternal
                        href="https://privacy.microsoft.com/fr-fr/privacystatement"
                        target="_blank"
                        rel="noreferrer"
                      >
                        https://privacy.microsoft.com/fr-fr/privacystatement
                      </NextLinkOrA>
                    </td>
                  </tr>
                  <tr>
                    <td>MATOMO</td>
                    <td>France</td>
                    <td>Suivi, analyse comportementale et mesure d’audience</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <h2>Cookies</h2>
            <p>
              En application de l’article 5(3) de la directive 2002/58/CE modifiée concernant le traitement des données
              à caractère personnel et la protection de la vie privée dans le secteur des communications électroniques,
              transposée à l’article 82 de la loi n°78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et
              aux libertés, les traceurs ou cookies suivent deux régimes distincts.
            </p>
            <p>
              Les cookies strictement nécessaires au service ou ayant pour finalité exclusive de faciliter la
              communication par voie électronique sont dispensés de consentement préalable au titre de l’article 82 de
              la loi n°78-17 du 6 janvier 1978.{" "}
            </p>
            <p>
              Les cookies n’étant pas strictement nécessaires au service ou n’ayant pas pour finalité exclusive de
              faciliter la communication par voie électronique doivent être consenti par l’utilisateur.
            </p>
            <p>
              Les traceurs ont vocation à être conservés sur le poste informatique de l'Internaute pour une durée allant
              jusqu'à 13 mois.
            </p>
            <p>Ci-dessous, la liste des cookies utilisés par IndexEgaPro.</p>
            <div className="fr-table fr-table--bordered">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Nom</th>
                    <th scope="col">Type</th>
                    <th scope="col">Usage</th>
                    <th scope="col">Émetteur</th>
                    <th scope="col">Qui a accès&nbsp;?</th>
                    <th scope="col">Consentement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>MATOMO</td>
                    <td>Mesure d’audience</td>
                    <td>Outil d’analyse comportementale des utilisateurs</td>
                    <td>MATOMO</td>
                    <td>Direction générale du Travail&nbsp;; MATOMO </td>
                    <td>Oui</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Vous pouvez retirer votre consentement relatif aux cookies{" "}
              <Button priority="secondary" {...consentModalButtonProps}>
                ici
              </Button>
            </p>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

PrivacyPolicy.getLayout = ({ children }) => {
  return <BasicLayoutPublic title="Politique de confidentialité">{children}</BasicLayoutPublic>;
};

export default PrivacyPolicy;
