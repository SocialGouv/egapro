import { useAutoAnimate } from "@formkit/auto-animate/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import type { NextPageWithLayout } from "../_app";

import type { RepresentationEquilibreeDataField } from "@common/models/representation-equilibree";
import { buildRepresentation } from "@common/models/representation-equilibree";
import { ClientOnly } from "@components/ClientOnly";
import { DetailRepresentationEquilibree } from "@components/RepresentationEquilibree";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import { Alert, AlertTitle, ButtonAsLink, FormButton, FormLayout, FormLayoutButtonGroup } from "@design-system";
import { putRepresentationEquilibree, useFormManager, useUser } from "@services/apiClient";

const title = "Validation de vos écarts";

const SERVER_ERROR = `Problème lors de l'envoi de la représentation équilibrée.`;

const Validation: NextPageWithLayout = () => {
  useUser({ redirectTo: "/representation-equilibree/email" });
  const router = useRouter();
  const { formData } = useFormManager();
  const [globalError, setGlobalError] = useState("");
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const [data, setData] = useState<RepresentationEquilibreeDataField>();

  useEffect(() => {
    setData(buildRepresentation(formData));
  }, [formData]);

  const sendRepresentationEquilibree = async () => {
    try {
      await putRepresentationEquilibree(formData);
      router.push("/representation-equilibree/transmission");
    } catch (error) {
      console.error(error);
      setGlobalError(SERVER_ERROR);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousPage =
    formData?.isEcartsMembresCalculable === false && formData?.isEcartsCadresCalculable === false
      ? "/representation-equilibree/ecarts-membres"
      : "/representation-equilibree/publication";

  return (
    <ClientOnly>
      <h1>{title}</h1>

      <div ref={animationParent}>
        {globalError && (
          <Alert type="error" size="sm" mb="4w">
            <AlertTitle>Erreur</AlertTitle>
            <p>{globalError}</p>
          </Alert>
        )}
      </div>

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
    </ClientOnly>
  );
};

Validation.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout title="Validation">{children}</RepresentationEquilibreeLayout>;
};

export default Validation;
