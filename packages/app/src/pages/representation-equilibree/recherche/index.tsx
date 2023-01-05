import { capitalize } from "@common/utils/string";
import { RepresentationEquilibreeStartLayout } from "@components/layouts/RepresentationEquilibreeStartLayout";
import {
  Alert,
  AlertTitle,
  Box,
  ButtonGroup,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormSelect,
  TileCompanyRepeqs,
} from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { filterDepartements, useConfig } from "@services/apiClient";
import { getLastModifiedDateFile } from "@services/apiClient/getDateFile";
import { useIsFirstRender } from "@services/apiClient/useIsFirstRender";
import type { RepeqsType } from "@services/apiClient/useSearchRepeqs";
import { useSearchRepeqs } from "@services/apiClient/useSearchRepeqs";
import { useRouter } from "next/router";
import type { ParsedUrlQueryInput } from "querystring";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type { NextPageWithLayout } from "../../_app";

type FormTypeInput = {
  departement: string;
  naf: string;
  q: string;
  region: string;
};

/**
 * Inputs in URLSearchParams can be string or array of string. We need to have a consistent type as a string.
 */
function normalizeInputs(parsedUrlQuery: ParsedUrlQueryInput) {
  const { q, region, departement, naf } = parsedUrlQuery;

  return {
    ...(q && { q: Array.isArray(q) ? q[0] : q }),
    ...(region && { region: Array.isArray(region) ? region[0] : region }),
    ...(departement && { departement: Array.isArray(departement) ? departement[0] : departement }),
    ...(naf && { naf: Array.isArray(naf) ? naf[0] : naf }),
  };
}

const DisplayRepeqs = ({ repeqs, error, isLoading }: { error: unknown; isLoading: boolean; repeqs: RepeqsType }) => {
  const [animationParent] = useAutoAnimate<HTMLDivElement>();
  // if (isLoading) return <Alert type="info">Recherche en cours</Alert>;
  if (isLoading) return null;

  if (error) {
    return (
      <Alert size="sm" type="error" mt="3w">
        <p>Il y a eu une erreur lors de la recherche.</p>
      </Alert>
    );
  }

  if (!repeqs || isLoading) {
    return null;
  }

  if (repeqs.count === 0) {
    return (
      <Alert type="info" mt="3w">
        <AlertTitle as="h2">Aucune entreprise trouvée.</AlertTitle>
        <p>Veuillez modifier votre recherche.</p>
      </Alert>
    );
  }

  return (
    <div className="fr-mt-3w">
      {!repeqs?.count ? null : (
        <p>
          {repeqs?.data?.length} {repeqs?.count > 10 ? `sur ${repeqs?.count}` : ""} résultat
          {repeqs?.count > 1 ? "s" : ""}
        </p>
      )}
      <div className="fr-grid-row fr-grid-row--gutters" ref={animationParent}>
        {repeqs.data.map(repeq => (
          <div key={repeq.entreprise.siren} className="fr-col-12">
            <TileCompanyRepeqs {...repeq} />
          </div>
        ))}
      </div>
    </div>
  );
};

function FormSearchSiren() {
  const router = useRouter();
  const { config } = useConfig();
  const { REGIONS_TRIES = [], SECTIONS_NAF_TRIES = [] } = config ?? {};
  const params = normalizeInputs(router.query);
  const [departements, setDepartements] = useState<ReturnType<typeof filterDepartements>>([]);
  const isFirstRender = useIsFirstRender();
  const { repeqs, error, isLoading, size, setSize } = useSearchRepeqs(isFirstRender ? undefined : params);
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
  } = useForm<FormTypeInput>(); // Using defaultValues would not be enough here, because we fetch params.query which is not present at the first rehydration time (see Next.js docs). So we use reset API below.

  const resetInputs = useCallback(
    (params: ReturnType<typeof normalizeInputs>) => {
      reset({
        region: params.region || "",
        departement: params.departement || "",
        naf: params.naf || "",
        q: params.q || "",
      });
    },
    [reset],
  );

  // Sync form data with URL params.
  useEffect(() => {
    resetInputs({ region: params.region, departement: params.departement, naf: params.naf, q: params.q });
  }, [resetInputs, params.region, params.departement, params.naf, params.q]);

  const regionSelected = watch("region");

  useEffect(() => {
    // Load of departments, initial and in sync with region.
    setDepartements(filterDepartements(config, regionSelected));
    setValue("departement", "");
  }, [config, regionSelected, setValue]); // config change only at start.

  function onSubmit(data: FormTypeInput) {
    router.replace({ pathname: "/representation-equilibree/recherche", query: data });
  }

  return (
    <>
      <h1 className="fr-h2">Rechercher la représentation équilibrée d'une entreprise</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <FormGroup>
              <FormGroupLabel htmlFor="q">Nom ou numéro Siren de l’entreprise</FormGroupLabel>
              <FormInput
                id="q"
                placeholder="Saisissez le nom ou le Siren d'une entreprise"
                {...register("q")}
                aria-describedby={errors.q && "q-message-error"}
              />
              {errors.q && <FormGroupMessage id="q-message-error">{errors.q.message}</FormGroupMessage>}
            </FormGroup>
          </div>
          <div className="fr-col-12 fr-col-sm-4">
            <FormGroup>
              <FormSelect
                id="region"
                {...register("region")}
                aria-describedby={errors.region && "region-message-error"}
              >
                <option value="">Région</option>
                {REGIONS_TRIES.map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </FormGroup>
          </div>

          <div className="fr-col-12 fr-col-sm-4">
            <FormGroup>
              <FormSelect
                id="departement"
                {...register("departement")}
                aria-describedby={errors.departement && "departement-message-error"}
              >
                <option value="">Département</option>
                {departements.map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </FormSelect>
            </FormGroup>
          </div>

          <div className="fr-col-12 fr-col-sm-4">
            <FormGroup>
              <FormSelect id="naf" {...register("naf")} aria-describedby={errors.naf && "naf-message-error"}>
                <option value="">Secteur d'activité</option>
                {SECTIONS_NAF_TRIES.map(([key, value]) => (
                  <option key={key} value={key}>
                    {capitalize(value)}
                  </option>
                ))}
              </FormSelect>
            </FormGroup>
          </div>

          <div className="fr-col-12">
            <ButtonGroup inline="mobile-up">
              <FormButton isDisabled={isLoading}>Rechercher</FormButton>
              <FormButton
                variant="secondary"
                type="reset"
                isDisabled={isLoading || !Object.values(watch()).filter(Boolean).length}
                onClick={() => {
                  resetInputs({});
                  router.replace({ pathname: "/representation-equilibree/recherche", query: { q: "" } });
                }}
              >
                Réinitialiser
              </FormButton>
            </ButtonGroup>
          </div>
        </div>
      </form>

      <div ref={animationParent}>
        {!isFirstRender && <DisplayRepeqs repeqs={repeqs} error={error} isLoading={isLoading} />}

        {repeqs?.data?.length < repeqs?.count && (
          <div className="fr-mt-3w">
            <FormButton variant="secondary" onClick={() => setSize(size + 1)}>
              Voir les résultats suivants
            </FormButton>
          </div>
        )}
      </div>
    </>
  );
}

function DownloadFileZone() {
  const [dateFile, setDateFile] = useState("");

  useEffect(() => {
    async function runEffect() {
      setDateFile(await getLastModifiedDateFile("/dgt-export-representation.xlsx"));
    }
    runEffect();
  }, []);

  return dateFile ? (
    <p className="fr-mt-3w">
      <a href="/dgt-export-representation.xlsx">
        Télécharger le fichier des représentations équilibrées au {dateFile} (xslx)
      </a>
    </p>
  ) : null;
}

const HomePage: NextPageWithLayout = () => {
  return (
    <Box>
      <FormSearchSiren />
      <DownloadFileZone />
    </Box>
  );
};

HomePage.getLayout = ({ children }) => {
  return <RepresentationEquilibreeStartLayout>{children}</RepresentationEquilibreeStartLayout>;
};

export default HomePage;
