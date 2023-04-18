import { AlertEdition } from "@components/AlertEdition";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import { useConfig, useFormManager } from "@services/apiClient";
import { useRouter } from "next/router";
import {
  ButtonAsLink,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
} from "packages/app/src/design-system/server";
import type { FormEvent } from "react";

import type { NextPageWithLayout } from "../_app";

const InformationsEntreprise: NextPageWithLayout = () => {
  const router = useRouter();

  // No need to use React Hook Form here, because we only show read only data.
  const { formData } = useFormManager();
  const { config } = useConfig();
  const { regionLabelFromCode, departementLabelFromCode, nafLabelFromCode } = config;

  const { région, département, code_naf } = formData.entreprise || {};

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/representation-equilibree/periode-reference");
  };

  return (
    <>
      <AlertEdition />
      <p>
        <b>
          Les informations relatives à l'entreprise (raison sociale, Code NAF, Adresse complète) sont renseignées
          automatiquement et sont non modifiables (source : Répertoire Sirene de l'INSEE).
        </b>
      </p>

      <form noValidate onSubmit={e => handleSubmit(e)}>
        <FormLayout>
          <FormGroup>
            <FormGroupLabel htmlFor="siren">Siren</FormGroupLabel>
            <FormInput id="siren" type="text" readOnly value={formData.entreprise?.siren || ""} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="raison-sociale">Raison sociale de l'entreprise</FormGroupLabel>
            <FormInput id="raison-sociale" type="text" readOnly value={formData.entreprise?.raison_sociale || ""} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="code-naf">Code NAF</FormGroupLabel>
            <FormInput id="code-naf" type="text" readOnly value={nafLabelFromCode(code_naf)} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="region">Région</FormGroupLabel>
            <FormInput id="region" type="text" readOnly value={regionLabelFromCode(région)} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="departement">Département</FormGroupLabel>
            <FormInput id="departement" type="text" readOnly value={departementLabelFromCode(département)} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="adresse">Adresse</FormGroupLabel>
            <FormInput id="adresse" type="text" readOnly value={formData.entreprise?.adresse || ""} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="code-postal">Code postal</FormGroupLabel>
            <FormInput id="code-postal" type="text" readOnly value={formData.entreprise?.code_postal || ""} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="commune">Commune</FormGroupLabel>
            <FormInput id="commune" type="text" readOnly value={formData.entreprise?.commune || ""} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="code-pays">Code pays</FormGroupLabel>
            <FormInput id="code-pays" type="text" readOnly value={formData.entreprise?.code_pays || ""} />
          </FormGroup>
          <FormLayoutButtonGroup>
            <ButtonAsLink href="/representation-equilibree/declarant" variant="secondary">
              Précédent
            </ButtonAsLink>
            <FormButton>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

InformationsEntreprise.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout title="Informations entreprise">{children}</RepresentationEquilibreeLayout>;
};

export default InformationsEntreprise;
