import NextLink from "next/link";
import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  Alert,
  AlertTitle,
  ButtonAsLink,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentLegend,
  CardBodyContentTitle,
  CardBodyFooter,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormRadioGroup,
  FormRadioGroupContent,
  FormRadioGroupInput,
  FormRadioGroupLegend,
  FormSelect,
  Link,
  LinkGroup,
} from "@design-system";

const title = "Écarts de représentation";

const EcartsCadres: NextPageWithLayout = () => {
  return (
    <>
      <h1>{title}</h1>
      <h2>Cadres dirigeants</h2>
      <Alert mb="4w">
        <AlertTitle as="h3">Motifs de non calculabilité</AlertTitle>
        <p>
          Les écarts de représentation Femmes-Hommes parmi les cadres dirigeants sont incalculables lorsqu'il n'y aucun
          ou un seul cadre dirigeant.
        </p>
      </Alert>
      <form>
        <FormLayout>
          <FormRadioGroup inline>
            <FormRadioGroupLegend id="representation-gap">
              L’écart de représentation est-il calculable&nbsp;?
            </FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput id="is-calculable" name="calculable">
                Oui
              </FormRadioGroupInput>
              <FormRadioGroupInput id="is-not-calculable" name="calculable">
                Non
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="percentage-of-women">
              Pourcentage de femmes parmi les cadres dirigeants
            </FormGroupLabel>
            <FormInput id="percentage-of-women" type="number" />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="percentage-of-men">
              Pourcentage d'hommes parmi les cadres dirigeants
            </FormGroupLabel>
            <FormInput id="percentage-of-men" type="number" />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="not-calculability-reason">Motif de non calculabilité</FormGroupLabel>
            <FormSelect id="not-calculability-reason">
              <option value="0">Il n'y a aucun cadre dirigeant</option>
              <option value="1">Il n'y a qu'un seul cadre dirigeant</option>
            </FormSelect>
            <FormLayoutButtonGroup>
              {/* TODO: add real path */}
              <NextLink href="/" passHref>
                <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
              </NextLink>
              <FormButton isDisabled>Suivant</FormButton>
            </FormLayoutButtonGroup>
          </FormGroup>
        </FormLayout>
      </form>
      <Card mt="4w">
        <CardBody>
          <CardBodyContent>
            <CardBodyContentLegend icon="fr-icon-arrow-right-line">Définition</CardBodyContentLegend>
            <CardBodyContentTitle>Cadres dirigeants</CardBodyContentTitle>
            <CardBodyContentDescription>
              Sont considérés comme ayant la qualité de cadre dirigeant les cadres auxquels sont confiées des
              responsabilités dont l'importance implique une grande indépendance dans l'organisation de leur emploi du
              temps, qui sont habilités à prendre des décisions de façon largement autonome et qui perçoivent une
              rémunération se situant dans les niveaux les plus élevés des systèmes de rémunération pratiqués dans leur
              entreprise ou établissement.
            </CardBodyContentDescription>
          </CardBodyContent>
          <CardBodyFooter>
            <LinkGroup>
              <Link href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902439/" target="_blank">
                En savoir plus
              </Link>
            </LinkGroup>
          </CardBodyFooter>
        </CardBody>
      </Card>
    </>
  );
};

EcartsCadres.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default EcartsCadres;
