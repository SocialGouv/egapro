import { useRouter } from "next/router";

import { useFormManager } from "../../services/apiClient/form-manager";
import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { FormButton, FormGroup, FormInput, FormGroupLabel, FormLayout, FormLayoutButtonGroup } from "@design-system";

const title = "Informations entreprise";

const InformationsEntreprise: NextPageWithLayout = () => {
  // No need to use React Hook Form here, because we only show read only data.
  const { formData } = useFormManager();

  const router = useRouter();

  // useEffect(() => {
  //   if (!isAuthenticated) router.push("/ecart-rep/email");
  // }, [isAuthenticated, router]);

  if (!formData?.entreprise?.siren) return <p>Loading...</p>;

  return (
    <>
      <h1>{title}</h1>

      <p>
        Les informations relatives à l'entreprise (raison sociale, Code NAF, Adresse complète) sont renseignées
        automatiquement et sont non modifiables (source : Répertoire Sirene de l'INSEE).
      </p>

      <form noValidate>
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
            <FormButton type="button" variant="secondary" onClick={() => router.push("/ecart-rep/declarant")}>
              Précédent
            </FormButton>
            <FormButton type="button" onClick={() => router.push("/ecart-rep/periode-reference")}>
              Suivant
            </FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

InformationsEntreprise.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default InformationsEntreprise;
