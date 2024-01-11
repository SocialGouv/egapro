import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Card from "@codegouvfr/react-dsfr/Card";
import {
  Box,
  CenteredContainer,
  Container,
  Grid,
  GridCol,
  Icon,
  ImgRepresentationEquilibree,
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
                text="L’Index de l'égalité professionnelle a été conçu pour faire progresser au sein des entreprises l’égalité salariale entre les femmes et les hommes. Il permet de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression. Lorsque des disparités salariales sont constatées, des mesures de correction doivent être prises."
              />
              <p>
                Toutes les <strong>entreprises d’au moins 50 salariés</strong> doivent calculer et publier leur Index{" "}
                <strong>chaque année au plus tard le 1er mars</strong>.
              </p>
              <p>
                Les entreprises ayant obtenu un index inférieur à 75 points doivent publier, par une communication
                externe et au sein de l’entreprise, les mesures de correction qu’elles ont définies par accord ou, à
                défaut, par décision unilatérale. Par ailleurs, celles ayant obtenu un index inférieur à 85 points
                doivent fixer, également par accord ou, à défaut, par décision unilatérale, et publier des objectifs de
                progression de chacun des indicateurs de l’Index.
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
            desc="Vous pouvez calculer votre index égalité professionnelle F/H et le déclarer à l'administration, si vous le souhaitez, suite au calcul, via le formulaire suivant."
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
            desc="Vous pouvez déclarer votre index égalité professionnelle F/H calculé par ailleurs directement via le formulaire suivant."
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
            desc="Vous pouvez déclarer vos mesures de correction si votre index est inférieur à 75 points et vos objectifs de progression si votre index est inférieur à 85 points via le formulaire accessible dans votre espace personnel."
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
            desc="Pour avoir plus d'informations, vous pouvez consulter le site internet du Ministère du Travail ou l'aide pour le calcul de l'index."
            footer={
              <ButtonsGroup
                buttonsEquisized
                buttonsSize="small"
                inlineLayoutWhen="sm and up"
                buttons={[
                  {
                    children: "Consulter le site du Ministère du Travail",
                    priority: "secondary",
                    linkProps: {
                      href: "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro",
                    },
                  },
                  {
                    children: "Consulter l'aide du calcul de l'index",
                    priority: "secondary",
                    linkProps: {
                      href: "/aide-simulation",
                    },
                  },
                ]}
              />
            }
          />
        </CenteredContainer>
      </Box>
    </>
  );
};

export default IndexEgapro;
