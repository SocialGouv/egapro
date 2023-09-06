"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { sirenSchema } from "@common/core-domain/dtos/helpers/common";
import { getAdditionalMeta } from "@common/core-domain/helpers/entreprise";
import { type ImpersonatedSession } from "@common/core-domain/helpers/impersonate";
import { COUNTRIES_COG_TO_ISO } from "@common/dict";
import { formatIsoToFr } from "@common/utils/date";
import { abortablePromise, AbortedWarning } from "@common/utils/promise";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { FormLayout, RecapCardCompany } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { getCompany } from "@globalActions/company";
import { CompanyErrorCodes } from "@globalActions/companyErrorCodes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  siren: sirenSchema,
});

type FormType = z.infer<typeof formSchema>;

export const ImpersonateForm = () => {
  const session = useSession({
    required: true,
  });
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
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    return () => {
      abortController.abort();
    };
  }, []);

  if (session.status !== "authenticated") return <SkeletonForm />;

  const onSubmit = async () => {
    await session.update({
      user: {
        staff: false,
        companies: [
          {
            label: company?.simpleLabel,
            siren: company?.siren,
          },
        ],
      },
      staff: {
        impersonating: true,
      },
    } as ImpersonatedSession);
  };

  const onStopImpersonating = async () => {
    await session.update({
      staff: {
        impersonating: false,
      },
    });
  };

  return (
    <>
      <ClientAnimate>
        {session.data.staff.impersonating && (
          <Alert
            className="fr-mb-2w"
            title="Vous êtes en train de mimoquer une entreprise"
            severity="info"
            description={`Vous êtes actuellement sous l'identité d'une entreprise (${session.data.user.companies[0].siren}). Pour revenir à votre
          compte staff normal, cliquez sur le bouton "Arrêter de mimoquer.`}
          />
        )}
      </ClientAnimate>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormLayout>
          <datalist id="siren-list">
            {session.data.staff.lastImpersonated?.map(company => (
              <option key={company.siren} value={company.siren}>
                {company.label}
              </option>
            ))}
          </datalist>
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
          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            buttons={[
              {
                children: "Valider",
                disabled: !isValid || pending,
              },
              {
                children: "Arrêter de mimoquer",
                disabled: !session.data?.staff.impersonating,
                type: "button",
                priority: "secondary",
                onClick: onStopImpersonating,
              },
            ]}
          />
          <ClientAnimate>
            {company &&
              (() => {
                const { address, countryCodeCOG, postalCode } = getAdditionalMeta(company);

                return (
                  <>
                    <DebugButton alwaysOn obj={company}>
                      Debug entreprise
                    </DebugButton>
                    {company.dateCessation && (
                      <Alert
                        className="fr-mb-2w"
                        severity="warning"
                        small
                        description={`L'entreprise a été fermée le ${formatIsoToFr(company.dateCessation)}`}
                      />
                    )}
                    <RecapCardCompany
                      full
                      title="Informations de l'entreprise à mimoquer"
                      company={{
                        address,
                        city: company.firstMatchingEtablissement.libelleCommuneEtablissement,
                        countryIsoCode: COUNTRIES_COG_TO_ISO[countryCodeCOG],
                        nafCode: company.activitePrincipaleUniteLegale,
                        name: company.simpleLabel,
                        postalCode,
                        siren: company.siren,
                      }}
                    />
                  </>
                );
              })()}
          </ClientAnimate>
        </FormLayout>
      </form>
    </>
  );
};
