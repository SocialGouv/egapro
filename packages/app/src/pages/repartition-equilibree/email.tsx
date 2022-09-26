import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
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
  const [isTokenRequested, setTokenRequested] = React.useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitted, isDirty, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema as any), // Configuration the validation with the zod schema.
    defaultValues: {
      email: "",
    },
  });

  const email = watch("email");

  const onSubmit = async ({ email }: FormType) => {
    try {
      await requestEmailForToken(email);
      setTokenRequested(true);
    } catch (error) {
      setTokenRequested(false);
    }
  };

  return (
    <>
      <h1>{title}</h1>

      {isTokenRequested ? (
        <>
          <p>Un mail vous a été envoyé.</p>
          <p>
            Si vous ne recevez pas ce mail sous peu, il se peut que l'email saisi (<strong>{email}</strong>) soit
            incorrect, ou bien que le mail ait été déplacé dans votre dossier de courriers indésirables ou dans le
            dossier SPAM.
          </p>
          <p>En cas d'échec, la procédure devra être reprise avec un autre email.</p>
          <FormButton onClick={() => router.back()}>Réessayer</FormButton>
        </>
      ) : (
        <>
          <p>L’email saisi doit être valide.</p>
          <p>
            Pour pouvoir poursuivre la transmission des informations requises, celui-ci doit correspondre à celui de la
            personne à contacter par les services de l’inspection du travail en cas de besoin et sera celui auquel sera
            adressé l’accusé de réception en fin de procédure.
          </p>
          <p>
            Si vous souhaitez visualiser ou modifier votre déclaration déjà transmise, veuillez saisir l’email utilisé
            pour la déclaration.
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
      )}
    </>
  );
}

EmailPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
