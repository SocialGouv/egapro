import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { FeatureStatus } from "@common/utils/feature";
import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { FormButton, FormGroup, FormGroupMessage, FormInput, FormGroupLabel, FormSelect } from "@design-system";

const title = "Commencer ou accéder à une déclaration";

const formSchema = z.object({
  year: z.string().min(1, "L'année est requise."), // No control needed because this is a select with options we provide.
  // siren: z.string().min(9, SIZE_SIREN_ERROR).max(9, SIZE_SIREN_ERROR),
  siren: z.string().regex(/^[0-9]{9}$/, "Le Siren est invalide."),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

export default function CommencerPage() {
  const { isAuthenticated } = useUser();
  const router = useRouter();

  const [featureStatus, setFeatureStatus] = React.useState<FeatureStatus>({ type: "idle" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted, isDirty, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema as any), // Configuration the validation with the zod schema.
    defaultValues: {
      year: undefined,
      siren: undefined,
    },
  });

  React.useEffect(() => {
    if (!isAuthenticated) router.push("/ecart-rep/email");
  }, [isAuthenticated, router]);

  const onSubmit = async ({ year, siren }: FormType) => {
    console.log("dans submit");
    console.log("year", year);
    console.log("siren", siren);
  };

  console.log("errors", errors);

  return (
    <>
      <h1>{title}</h1>

      <p>
        Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
        correspondantes à la déclaration.
      </p>

      <p>Année au titre de laquelle les écarts de représentation sont calculés.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormGroup>
          <FormSelect
            id="year"
            placeholder="Sélectionnez une année"
            {...register("year")}
            isError={Boolean(errors.year)}
            aria-describedby="year-message-error-msg"
          >
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </FormSelect>
          {errors.year && <FormGroupMessage id="year-message-error">{errors.year.message}</FormGroupMessage>}
        </FormGroup>
        <FormGroup>
          <FormGroupLabel htmlFor="siren" hint="9 chiffres">
            Numéro Siren de l'entreprise
          </FormGroupLabel>
          <FormInput
            id="siren"
            placeholder="Ex: 504920166"
            type="text"
            {...register("siren")}
            isError={Boolean(errors.siren)}
            maxLength={9}
          />
          {errors.siren && <FormGroupMessage id="siren-message">{errors.siren.message}</FormGroupMessage>}
        </FormGroup>

        <FormButton isDisabled={(isSubmitted && !isValid) || !isDirty}>Suivant</FormButton>
      </form>
    </>
  );
}

CommencerPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
