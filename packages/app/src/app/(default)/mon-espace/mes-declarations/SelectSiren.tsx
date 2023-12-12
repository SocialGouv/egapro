"use client";

import { fr } from "@codegouvfr/react-dsfr";
import SelectNext from "@codegouvfr/react-dsfr/SelectNext";
import { Grid, GridCol } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { first } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const SelectSiren = ({
  sirenListWithCompanyName,
  currentSiren,
}: {
  currentSiren?: string;
  sirenListWithCompanyName: Array<{ companyName: string; siren: string }>;
}) => {
  const router = useRouter();
  const sirenSchema = z.object({
    siren: z
      .string()
      .length(9)
      .regex(/^\d+$/)
      .refine(siren => sirenList.includes(siren), {
        message: "Vous n'avez pas les droits sur ce Siren.",
      }),
  });

  type sirenFormType = z.infer<typeof sirenSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<sirenFormType>({
    resolver: zodResolver(sirenSchema),
  });

  const sirenValue = watch("siren");
  const sirenList = sirenListWithCompanyName.map(({ siren }) => siren);

  const onSubmit = (data: sirenFormType) => {
    router.push(`/mon-espace/mes-declarations?siren=${data.siren}`);
  };

  useEffect(() => {
    if (isValid && sirenValue !== currentSiren) {
      handleSubmit(onSubmit)();
    }
  }, [sirenValue, isValid, handleSubmit, onSubmit]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid>
        <GridCol sm={3}>
          <SelectNext
            label="SIREN"
            nativeSelectProps={{
              ...register("siren"),
            }}
            options={sirenList.map(value => ({
              value,
              label: value,
              selected: currentSiren ? value === currentSiren : value === first(sirenList),
            }))}
          />
        </GridCol>
        <GridCol sm={9}>
          <div className={fr.cx("fr-pt-10v", "fr-pl-2v")}>
            <span className={fr.cx("fr-icon-building-line", "fr-pr-2v")} aria-hidden="true"></span>
            <span>{sirenListWithCompanyName.find(data => data.siren === sirenValue)?.companyName || ""}</span>
          </div>
        </GridCol>
      </Grid>
    </form>
  );
};
