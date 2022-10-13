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

const EcartsMembres: NextPageWithLayout = () => {
  return (
    <>
      <h1>{title}</h1>
      <h2>Membres des instances dirigeantes</h2>
      <Alert mb="4w">
        <AlertTitle as="h3">Motifs de non calculabilité</AlertTitle>
        <p>
          "Les écarts de représentation femmes-hommes parmi les membres des instances dirigeantes sont incalculables
          lorsqu'il n'y a pas d'instance dirigeante.
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
              Pourcentage de femmes parmi les membres des instances dirigeantes
            </FormGroupLabel>
            <FormInput id="percentage-of-women" type="number" />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="percentage-of-men">
              Pourcentage d’hommes parmi les membres des instances dirigeantes
            </FormGroupLabel>
            <FormInput id="percentage-of-men" type="number" />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="not-calculability-reason">Motif de non calculabilité</FormGroupLabel>
            <FormSelect id="not-calculability-reason">
              <option value="0">Il n'y a aucune instance dirigeante</option>
            </FormSelect>
          </FormGroup>
          <FormLayoutButtonGroup>
            <NextLink href="/ecart-rep/ecarts-cadres" passHref>
              <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
            </NextLink>
            <FormButton isDisabled>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
      <Card mt="4w">
        <CardBody>
          <CardBodyContent>
            <CardBodyContentLegend icon="fr-icon-arrow-right-line">Définition</CardBodyContentLegend>
            <CardBodyContentTitle>Membres des instances dirigeantes</CardBodyContentTitle>
            <CardBodyContentDescription>
              Est considérée comme instance dirigeante toute instance mise en place au sein de la société, par tout acte
              ou toute pratique sociétaire, aux fins d'assister régulièrement les organes chargés de la direction
              générale dans l'exercice de leurs missions.
            </CardBodyContentDescription>
          </CardBodyContent>
          <CardBodyFooter>
            <LinkGroup>
              <Link target="_blank" href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044566715">
                En savoir plus
              </Link>
            </LinkGroup>
          </CardBodyFooter>
        </CardBody>
      </Card>
    </>
  );
};

EcartsMembres.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default EcartsMembres;
