import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { requestEmailForToken } from "@common/utils/api";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import { FormButton, FormGroup, FormGroupMessage, FormInput, FormLabel } from "@design-system";

const title = "Validation de l'email";

const formSchema = z.object({
  email: z.string().min(1, "L'email est requis.").email({ message: "L'email est invalide." }),
});

// Infer the TS type according to the zod schema.
type FormType = z.infer<typeof formSchema>;

export default function EmailPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted, isDirty, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema as Zod.ZodType<any, any, any>), // Configuration the validation with the zod schema.
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = ({ email }: FormType) => {
    requestEmailForToken(email);
  };

  return (
    <>
      <h1>{title}</h1>
      <p>L’email saisi doit être valide.</p>
      <p>
        Pour pouvoir poursuivre la transmission des informations requises, celui-ci doit correspondre à celui de la
        personne à contacter par les services de l’inspection du travail en cas de besoin et sera celui auquel sera
        adressé l’accusé de réception en fin de procédure.
      </p>
      <p>
        Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir l’email utilisé pour
        la déclaration.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <FormLabel htmlFor="email">Adresse email</FormLabel>
          <FormInput id="email" {...register("email")} />
          {errors.email?.message && <FormGroupMessage id="email">{errors.email.message}</FormGroupMessage>}
        </FormGroup>

        <FormButton type="submit" isDisabled={!isDirty || isSubmitting || (isSubmitted && !isValid)}>
          Envoyer
        </FormButton>
      </form>
    </>
  );
}

EmailPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
