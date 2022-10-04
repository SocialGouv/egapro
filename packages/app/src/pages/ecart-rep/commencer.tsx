import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { formatZodErrors } from "@common/utils/debug";
import type { FeatureStatus } from "@common/utils/feature";
import { useUser } from "@components/AuthContext";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { FormButton, FormGroup, FormInput, FormLabel, FormSelect } from "@design-system";

const title = "Commencer ou accéder à une déclaration";

const SIZE_SIREN_ERROR = "Un numéro Siren a 9 caractères";

const formSchema = z.object({
  year: z.string(), // No control needed because this is a select with options we provide.
  siren: z.string().min(9, SIZE_SIREN_ERROR).max(9, SIZE_SIREN_ERROR),
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
          <FormSelect id="year" placeholder="Sélectionnez une année" {...register("year")}>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </FormSelect>
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="siren">Numéro Siren de l'entreprise</FormLabel>
          <FormInput id="siren" placeholder="9 caractères" type="text" {...register("siren")} />
        </FormGroup>
        <FormButton isDisabled={false}>Suivant</FormButton>

        {formatZodErrors(errors as any)}
        <pre>{JSON.stringify(watch(), null, 2)}</pre>
      </form>
    </>
  );
}

CommencerPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
