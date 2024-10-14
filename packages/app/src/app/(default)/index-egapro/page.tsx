import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import {
  Box,
  CenteredContainer,
  Container,
  Grid,
  GridCol,
  Icon,
  ImgRepresentationEquilibree,
  Link,
  Text,
} from "@design-system";

const IndexEgapro = () => {
  return (
    <>
      <Container>
        <Breadcrumb
          homeLinkProps={{
            href: "/",
          }}
          segments={[]}
          currentPageLabel="Index de l'égalité professionnelle"
        />
      </Container>
      <Box pb="9w" as="section">
        <Container>
          <Grid>
            <GridCol lg={7}>
              <h1>
                <span className="fr-h3 fr-mb-0 block">Bienvenue sur</span> l'index de l'égalité professionnelle
              </h1>
              <Text
                variant={["lg", "bold"]}
                text="L’index de l'égalité professionnelle a été conçu pour faire progresser au sein des entreprises l’égalité salariale entre les femmes et les hommes. Il permet de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression. Lorsque des disparités salariales sont constatées, des mesures de correction doivent être prises."
              />
              <p>
                Toutes les <strong>entreprises et unités économiques et sociales (UES) d’au moins 50 salariés</strong>{" "}
                doivent calculer et publier leur index <strong>chaque année au plus tard le 1er mars</strong>. Elles
                doivent également le transmettre au comité social et économique et aux services du ministre chargé du
                travail.
              </p>
              <p>
                Les entreprises et UES ayant obtenu un index inférieur à 75 points doivent publier, par une
                communication externe et au sein de l’entreprise, les mesures de correction qu’elles ont définies par
                accord ou, à défaut, par décision unilatérale. Par ailleurs, celles ayant obtenu un index inférieur à 85
                points doivent fixer, également par accord ou, à défaut, par décision unilatérale, et publier des
                objectifs de progression de chacun des indicateurs de l’Index. Dans les deux cas, elles doivent
                également les transmettre au comité social et économique et aux services du ministre chargé du travail.
              </p>
            </GridCol>
            <GridCol lg={5}>
              <ImgRepresentationEquilibree />
            </GridCol>
          </Grid>
        </Container>
        <CenteredContainer py="2w">
          <Card
            horizontal
            detail={<Icon text="Étape 1" icon="fr-icon-arrow-right-line" size="sm" />}
            title="Calcul de l'index"
            desc={
              <span>
                Vous pouvez calculer votre index égalité professionnelle F/H via le formulaire suivant.
                <br /> A la suite du calcul, vous pourrez le transmettre aux services du ministre chargé du travail via
                le formulaire de déclaration.
              </span>
            }
            footer={
              <Button
                linkProps={{
                  href: "/index-egapro/simulateur/commencer",
                }}
              >
                Calculer mon index
              </Button>
            }
          />
        </CenteredContainer>
        <CenteredContainer pb="2w">
          <Card
            horizontal
            detail={<Icon text="Étape 2" icon="fr-icon-arrow-right-line" size="sm" />}
            title="Déclaration de l'index"
            desc="Vous pouvez transmettre aux services du ministre chargé du travail votre index égalité professionnelle F/H calculé par ailleurs directement via le formulaire de déclaration suivant."
            footer={
              <Button
                linkProps={{
                  href: "/index-egapro/declaration/assujetti",
                }}
              >
                Déclarer mon index
              </Button>
            }
          />
        </CenteredContainer>
        <CenteredContainer pb="2w">
          <Card
            horizontal
            detail={<Icon text="Étape 3" icon="fr-icon-arrow-right-line" size="sm" />}
            title="Déclaration des objectifs de progression et mesures de correction"
            desc="Vous pouvez transmettre aux services du ministre chargé du travail les informations relatives aux objectifs de progression, et le cas échéant aux mesures de correction, via le formulaire de déclaration accessible dans votre espace personnel (adresse email en haut à droite)."
            footer={
              <>
                <Button
                  linkProps={{
                    href: "/mon-espace/mes-declarations",
                  }}
                >
                  Accéder à mon espace
                </Button>
              </>
            }
          />
        </CenteredContainer>
        <CenteredContainer pb="2w">
          <Card
            horizontal
            detail={<Icon text="Étape 4" icon="fr-icon-arrow-right-line" size="sm" />}
            title="Publication"
            desc={
              <>
                L'index et les résultats obtenus à chaque indicateur doivent être publiés chaque année, au plus tard le
                1er mars, de manière visible et lisible sur le site internet de l'entreprise. Ils sont consultables au
                moins jusqu’à la publication des résultats l’année suivante. Si l’entreprise ne dispose pas de site
                internet, elle doit porter ces informations à la connaissance des salariés par tout moyen.
                <br />
                <br />
                Les mesures de correction et les objectifs de progression de chacun des indicateurs doivent être publiés
                sur le site internet de l’entreprise lorsqu’il en existe un, sur la même page que les résultats obtenus
                à l’Index, dès lors que l’accord ou la décision unilatérale est déposé.
                <br />
                <br />
                Les mesures de correction doivent rester consultables jusqu’à ce que l’entreprise obtienne un index au
                moins égal à 75 points. L'entreprise doit par ailleurs les porter à la connaissance des salariés par
                tout moyen.
                <br />
                <br />
                Les objectifs de progression doivent rester consultables jusqu’à ce que l’entreprise obtienne un index
                au moins égal à 85 points. À défaut de site internet, ils doivent être portés à la connaissance des
                salariés par tout moyen.
              </>
            }
          />
        </CenteredContainer>
        <CenteredContainer pb="2w">
          <Card
            horizontal
            title="Besoin d'aide ?"
            desc={
              <>
                <p>
                  Pour consulter l'aide du service d'identification <strong>ProConnect</strong> (comment s'identifier,
                  comment rattacher une nouvelle entreprise à son compte, comment contacter le support, etc.),{" "}
                  <Link href={"/aide-proconnect"} target="_blank">
                    cliquez ici
                  </Link>
                </p>
                <p>
                  Pour consulter l'aide pour <strong>le calcul, la publication et la transmission de l'index</strong>,{" "}
                  <Link href={"/aide-index"} target="_blank">
                    cliquez ici
                  </Link>
                </p>
                <p>
                  Pour consulter la <strong>FAQ</strong> sur le site internet du ministère chargé du travail,{" "}
                  <Link
                    href={
                      "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
                    }
                    target="_blank"
                  >
                    cliquez ici
                  </Link>
                </p>
                <p>
                  Pour contacter le <strong>référent égalité professionnelle</strong> au sein de votre DREETS,{" "}
                  <Link
                    href={"https://egapro.travail.gouv.fr/apiv2/public/referents_egalite_professionnelle.xlsx"}
                    target="_blank"
                  >
                    cliquez ici
                  </Link>
                </p>
              </>
            }
          />
        </CenteredContainer>
      </Box>
    </>
  );
};

export default IndexEgapro;
