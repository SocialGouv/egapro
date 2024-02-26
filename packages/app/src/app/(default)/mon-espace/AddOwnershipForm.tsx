"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Container } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { addSirens } from "./actions";

const formSchema = z.object({
  email: z.string().min(1, "L'adresse email est requise.").email("L'adresse email est invalide."),
});

type FormType = z.infer<typeof formSchema>;

export const AddOwnershipForm = ({ siren }: { siren: string }) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async ({ email }: FormType) => {
    await addSirens(email, [siren]);
    setValue("email", "");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Container fluid mt="4w">
        <Input
          label="Adresse email"
          state={errors.email?.message ? "error" : "default"}
          stateRelatedMessage={errors.email?.message}
          nativeInputProps={{
            ...register("email"),
            type: "email",
            spellCheck: false,
            autoComplete: "email",
            placeholder: "Exemple : nom@domaine.fr",
          }}
        />
        <Button disabled={!isValid} type="submit">
          Ajouter un responsable
        </Button>
      </Container>
    </form>
  );
};
