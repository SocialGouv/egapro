import { useRouter } from "next/router";
import * as React from "react";

import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { FormButton, FormGroup, FormInput, FormGroupLabel, FormLayout, FormLayoutButtonGroup } from "@design-system";
import { useFormManager } from "services/apiClient/form-manager";

const title = "Informations entreprise";

export default function InformationsEntreprise() {
  const { isAuthenticated } = useUser();

  const { formData } = useFormManager();

  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) router.push("/ecart-rep/email");
  }, [isAuthenticated, router]);

  const onSubmit = async () => {
    router.push("/ecart-rep/");
  };

  return (
    <>
      <h1>{title}</h1>

      <p>
        Les informations relatives à l'entreprise (raison sociale, Code NAF, Adresse complète) sont renseignées
        automatiquement et sont non modifiables (source : Répertoire Sirene de l'INSEE).
      </p>

      <form onSubmit={onSubmit} noValidate>
        <FormLayout>
          <FormGroup>
            <FormGroupLabel htmlFor="siren">Siren</FormGroupLabel>
            <FormInput id="siren" type="text" readOnly value={formData.entreprise?.siren} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="raison-sociale">Raison sociale de l'entreprise</FormGroupLabel>
            <FormInput id="raison-sociale" type="text" readOnly value={formData.entreprise?.raison_sociale} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="code-naf">Code NAF</FormGroupLabel>
            <FormInput id="code-naf" type="text" readOnly value={formData.entreprise?.code_naf} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="region">Région</FormGroupLabel>
            <FormInput id="region" type="text" readOnly value={formData.entreprise?.région} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="departement">Département</FormGroupLabel>
            <FormInput id="departement" type="text" readOnly value={formData.entreprise?.département} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="adresse">Adresse</FormGroupLabel>
            <FormInput id="adresse" type="text" readOnly value={formData.entreprise?.adresse} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="code-postal">Code postal</FormGroupLabel>
            <FormInput id="code-postal" type="text" readOnly value={formData.entreprise?.code_postal} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="commune">Commune</FormGroupLabel>
            <FormInput id="commune" type="text" readOnly value={formData.entreprise?.commune} />
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="code-pays">Code pays</FormGroupLabel>
            <FormInput id="code-pays" type="text" readOnly value={formData.entreprise?.code_pays} />
          </FormGroup>
          <FormLayoutButtonGroup>
            <FormButton>Suivant</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
}

InformationsEntreprise.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
