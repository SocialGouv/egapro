import { buildFormState, buildRepresentation } from "@common/models/representation-equilibree";
import { AlertEdition } from "@components/AlertEdition";
import { AlertFeatureStatus, FeatureStatusProvider, useFeatureStatus } from "@components/FeatureStatusProvider";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import { DetailRepresentationEquilibree } from "@components/RepresentationEquilibree";
import { ButtonAsLink, FormButton, FormLayout, FormLayoutButtonGroup } from "@design-system";
import { fetchRepresentationEquilibree, putRepresentationEquilibree, useFormManager } from "@services/apiClient";
import NextLink from "next/link";
import { useRouter } from "next/router";
import invariant from "tiny-invariant";

import type { NextPageWithLayout } from "../_app";

const Validation: NextPageWithLayout = () => {
  const router = useRouter();
  const { formData, saveFormData } = useFormManager();
  const { setFeatureStatus } = useFeatureStatus({ reset: true });

  let data;
  // Hack to prevent to prerender on the server.
  // The problem is formData is not null so buildRepresentation is tried and failed.
  try {
    data = buildRepresentation(formData);
  } catch (error) {
    console.debug("An error is possible in SSR, we can ignore it.");
  }
  const sendRepresentationEquilibree = async () => {
    try {
      invariant(formData.entreprise?.siren !== undefined, "Le Siren doit forcément être présent.");
      invariant(formData.year !== undefined, "L'année doit forcément être présente.");

      await putRepresentationEquilibree(formData);

      const repeq = await fetchRepresentationEquilibree(formData.entreprise.siren, formData.year);
      if (repeq) {
        saveFormData({ ...buildFormState(repeq.data), status: "edition" });
      }
      router.push("/representation-equilibree/transmission");
    } catch (error) {
      setFeatureStatus({ type: "error", message: "Problème lors de l'envoi de la représentation équilibrée." });
    }
  };

  const previousPage =
    formData?.isEcartsMembresCalculable === false && formData?.isEcartsCadresCalculable === false
      ? "/representation-equilibree/ecarts-membres"
      : "/representation-equilibree/publication";

  return (
    <>
      <AlertEdition />

      <AlertFeatureStatus type="error" title="Erreur" />

      <p>
        Vous êtes sur le point de valider la procédure vous permettant de transmettre aux services du ministre chargé du
        travail vos écarts éventuels de représentation femmes-hommes conformément aux dispositions de l’
        <a
          href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045669617"
          target="_blank"
          rel="noopener noreferrer"
        >
          article D. 1142-19 du code du travail
        </a>
        .
      </p>
      <p>
        Pour terminer la procédure, cliquez sur “Valider et transmettre les résultats” ci-dessous. Vous recevrez un
        accusé de réception par email.
      </p>
      <h2 className="fr-mt-6w">Récapitulatif</h2>

      {data && <DetailRepresentationEquilibree data={data} />}

      <FormLayout>
        <FormLayoutButtonGroup>
          <NextLink href={previousPage} passHref>
            <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
          </NextLink>
          <FormButton onClick={sendRepresentationEquilibree}>Valider et transmettre les résultats</FormButton>
        </FormLayoutButtonGroup>
      </FormLayout>
    </>
  );
};

Validation.getLayout = ({ children }) => {
  return (
    <RepresentationEquilibreeLayout title="Validation">
      <FeatureStatusProvider>{children}</FeatureStatusProvider>
    </RepresentationEquilibreeLayout>
  );
};

export default Validation;
