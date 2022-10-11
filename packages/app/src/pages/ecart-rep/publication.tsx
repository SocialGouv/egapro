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
  FormTextarea,
} from "@design-system";

const title = "Publication";

const Publication: NextPageWithLayout = () => {
  return (
    <>
      <h1>{title}</h1>
      <Alert mb="4w">
        <AlertTitle as="h2">Obligation de transparence</AlertTitle>
        <p>
          Les entreprises doivent publier chaque année, <strong>au plus tard le 1er mars</strong>, leurs écarts
          éventuels de représentation femmes-hommes pour les cadres dirigeants et au sein des instances dirigeantes de
          manière visible et lisible sur leur site internet, et les laisser en ligne jusqu’à la publication de leurs
          écarts l’année suivante. Si l’entreprise ne dispose pas de site internet, elle doit porter ces informations à
          la connaissance des salariés par tout moyen.
        </p>
      </Alert>
      <form>
        <FormLayout>
          <FormGroup>
            <FormGroupLabel htmlFor="publication-date">Date de publication des écarts calculables</FormGroupLabel>
            <FormInput id="publication-date" type="date" />
          </FormGroup>
          <FormRadioGroup inline>
            <FormRadioGroupLegend id="have-publishing-website">
              Avez-vous un site Internet pour publier les écarts calculables&nbsp;?
            </FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput id="have-website" name="have-publishing-website">
                Oui
              </FormRadioGroupInput>
              <FormRadioGroupInput id="no-website" name="have-publishing-website">
                Non
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="url-of-website">
              Indiquer l'adresse exacte de la page Internet (URL) sur laquelle seront publiés les écarts calculables
            </FormGroupLabel>
            <FormInput id="url-of-website" placeholder="https://" />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="content-of-publication">
              Préciser les modalités de communication des écarts calculables auprès de vos salariés
            </FormGroupLabel>
            <FormTextarea id="content-of-publication" />
          </FormGroup>
          <FormLayoutButtonGroup>
            {/* TODO: add real path */}
            <NextLink href="/" passHref>
              <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
            </NextLink>
            <FormButton isDisabled>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

Publication.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default Publication;
