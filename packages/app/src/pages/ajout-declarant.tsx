import { BasicLayout } from "@components/layouts/BasicLayout";
import {
  Container,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormTextarea,
  Grid,
  GridCol,
} from "@design-system";

import type { NextPageWithLayout } from "./_app";

const AddDeclarer: NextPageWithLayout = () => {
  return (
    <>
      <section>
        <Container py="8w">
          <Grid justifyCenter>
            <GridCol md={10} lg={8}>
              <h1>Demande d’ajout de nouveaux déclarants</h1>
              <p>
                Écrire un texte explicatif sur la procédure d’ajout de nouveaux déclarants. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Sed iaculis eu erat eu placerat. Phasellus eleifend malesuada odio eget
                consectetur.
              </p>
              <form onSubmit={() => console.log("submit")} noValidate>
                <FormLayout>
                  <FormGroup>
                    <FormGroupLabel htmlFor="email">Adresse email</FormGroupLabel>
                    <FormInput aria-describedby={"email-msg"} id="email" type="email" />
                  </FormGroup>
                  <FormGroup>
                    <FormGroupLabel
                      htmlFor="siren"
                      hint="Le numéro Siren se compose de 9 chiffres sans espace, il est possible d’ajouter plusieurs Siren séparées par des virgules."
                    >
                      Numéro(s) Siren
                    </FormGroupLabel>
                    <FormTextarea aria-describedby={"siren-msg"} id="siren" />
                  </FormGroup>
                  <FormGroup>
                    <FormGroupLabel
                      htmlFor="declarer-email"
                      hint="Il est possible d’ajouter plusieurs emails séparées par des virgules."
                    >
                      Numéro(s) Siren
                    </FormGroupLabel>
                    <FormTextarea aria-describedby={"declarer-email-msg"} id="declarer-email" />
                  </FormGroup>
                  <FormLayoutButtonGroup>
                    <FormButton type="button" onClick={() => console.log("onclick button")}>
                      Envoyer ma demande
                    </FormButton>
                  </FormLayoutButtonGroup>
                </FormLayout>
              </form>
            </GridCol>
          </Grid>
        </Container>
      </section>
    </>
  );
};

AddDeclarer.getLayout = ({ children }) => {
  return <BasicLayout title="Demande d’ajout de nouveaux déclarants">{children}</BasicLayout>;
};

export default AddDeclarer;
