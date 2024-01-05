"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { sirenSchema } from "@common/core-domain/dtos/helpers/common";
import { abortablePromise, AbortedWarning } from "@common/utils/promise";
import { Grid, GridCol } from "@design-system";
import { getCompany } from "@globalActions/company";
import { CompanyErrorCodes } from "@globalActions/companyErrorCodes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const SelectSirenStaff = ({ currentSiren }: { currentSiren?: string }) => {
  const router = useRouter();
  const formSirenSchema = z.object({
    siren: sirenSchema,
  });

  type sirenFormType = z.infer<typeof formSirenSchema>;
  const [abortController, setAbortController] = useState<AbortController>(new AbortController());
  const [pending, setPending] = useState(false);
  const [company, setCompany] = useState<Entreprise>();
  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isValid },
    getValues,
    getFieldState,
    trigger,
    watch,
  } = useForm<sirenFormType>({
    resolver: zodResolver(formSirenSchema),
  });

  const sirenValue = watch("siren");

  const onSubmit = (data: sirenFormType) => {
    router.push(`/mon-espace/mes-declarations?siren=${data.siren}`);
  };

  useEffect(() => {
    if (isValid && !pending && sirenValue !== currentSiren) {
      handleSubmit(onSubmit)();
    }
  }, [sirenValue, isValid, handleSubmit, onSubmit]);

  useEffect(() => {
    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid>
        <GridCol sm={3}>
          <Input
            label="Siren"
            state={errors.siren && "error"}
            stateRelatedMessage={errors.siren?.message}
            nativeInputProps={{
              list: "siren-list",
              ...register("siren", {
                maxLength: 9,
                minLength: 9,
                async onChange() {
                  abortController.abort("New request");
                  await trigger("siren");
                  const siren = getValues("siren");
                  const sirenFieldState = getFieldState("siren");
                  setCompany(void 0);
                  if (sirenFieldState.invalid) return;
                  const newAbortController = new AbortController();
                  setAbortController(newAbortController);
                  try {
                    setPending(true);
                    const company = await abortablePromise(getCompany(siren), newAbortController.signal);
                    if (!company.ok) {
                      console.warn(company.error);
                      setError("siren", {
                        message:
                          company.error === CompanyErrorCodes.NOT_FOUND
                            ? `Entreprise non trouvée avec le siren "${siren}"`
                            : "Erreur inconnue lors de la recherche d'entreprise.",
                        type: "manual",
                      });
                    } else {
                      setCompany(company.data);
                    }
                  } catch (e: unknown) {
                    if (!(e instanceof AbortedWarning)) {
                      throw e;
                    }
                  }
                  setPending(false);
                },
              }),
            }}
          />
        </GridCol>
        <GridCol sm={9}>
          <div className={fr.cx("fr-pt-10v", "fr-pl-2v")}>
            <span className={fr.cx("fr-icon-building-line", "fr-pr-2v")} aria-hidden="true"></span>
            <span>{company?.simpleLabel || ""}</span>
          </div>
        </GridCol>
      </Grid>
    </form>
  );
};
