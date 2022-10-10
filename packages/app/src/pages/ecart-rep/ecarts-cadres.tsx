import NextLink from "next/link";
import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  Alert,
  AlertTitle,
  ButtonAsLink,
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
      {/*
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
                // TODO: add real path
                <NextLink href="/" passHref>
                  <Link iconRight="fr-icon-arrow-right-line">Lien simple</Link>
                </NextLink>
              </LinkGroup>
            </CardBodyFooter>
          </CardBody>
        </Card>
      */}
    </>
  );
};

EcartsCadres.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default EcartsCadres;
