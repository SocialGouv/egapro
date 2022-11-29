import type { ParsedUrlQueryInput } from "querystring";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { NextPageWithLayout } from "../../_app";
import { capitalize } from "@common/utils/string";
import { RepresentationEquilibreeStartLayout } from "@components/layouts/RepresentationEquilibreeStartLayout";
import {
  Box,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormSelect,
} from "@design-system";
import { filterDepartements } from "@services/apiClient";
import { useConfig } from "@services/apiClient";

async function getDateCsv(): Promise<string> {
  try {
    const responseCsv = await fetch("/index-egalite-fh.csv", { method: "HEAD" });
    const date = responseCsv?.headers?.get("last-modified");

    if (date) {
      const lastModified = new Date(date);
      return format(lastModified, "dd/MM/yyyy");
    }
  } catch (error) {
    console.error("Error on fetch HEAD /index-egalite-fh.csv", error);
  }
  return "";
}

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

function FormSearchSiren() {
  const router = useRouter();
  const { config } = useConfig();
  const { REGIONS_TRIES = [], SECTIONS_NAF_TRIES = [] } = config ?? {};
  const params = normalizeInputs(router.query);
  const [departements, setDepartements] = useState<ReturnType<typeof filterDepartements>>([]);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
  } = useForm<FormTypeInput>(); // Using defaultValues would not be enough here, because we fetch user.email asynchronously and so it is not present at rehydration time. So we use reset API below.

  // Sync form data with URL params.
  useEffect(() => {
    reset({
      region: params.region || "",
      departement: params.departement || "",
      naf: params.naf || "",
      q: params.q || "",
    });
  }, [reset, params?.region, params?.departement, params?.naf, params?.q]);

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
      <h2>Rechercher la représentation équilibrée d'une entreprise</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <div>
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
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flexShrink: 1, flexBasis: "33%" }}>
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

            <div style={{ flexShrink: 1, flexBasis: "33%" }}>
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

            <div style={{ flexShrink: 1, flexBasis: "33%" }}>
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
          </div>

          <FormLayoutButtonGroup>
            <FormButton>Rechercher</FormButton>
            <FormButton
              variant="secondary"
              type="reset"
              onClick={() =>
                router.replace({ pathname: "/representation-equilibree/recherche", query: { region: "" } })
              }
            >
              Réinitialiser
            </FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
      <pre>{JSON.stringify(watch(), null, 2)}</pre>
    </>
  );
}

function DownloadCsvFileZone() {
  const [dateCsv, setDateCsv] = useState("");

  useEffect(() => {
    async function runEffect() {
      setDateCsv(await getDateCsv());
    }
    runEffect();
  }, []);

  return dateCsv ? (
    <>
      <div style={{ display: "flex" }}>
        <div>Télécharger le fichier des entreprises au {dateCsv}</div>

        <a href="">Télécharger (CSV)</a>
      </div>
    </>
  ) : null;
}

const HomePage: NextPageWithLayout = () => {
  return (
    <Box>
      <FormSearchSiren />

      <DownloadCsvFileZone />
    </Box>
  );
};

HomePage.getLayout = ({ children }) => {
  return <RepresentationEquilibreeStartLayout>{children}</RepresentationEquilibreeStartLayout>;
};

export default HomePage;
