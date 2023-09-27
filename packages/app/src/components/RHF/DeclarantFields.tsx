import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type SimpleObject } from "@common/utils/types";
import Link from "next/link";
import { useFormContext } from "react-hook-form";

import { Grid, GridCol } from "../../design-system/base/Grid";

interface DeclarantFieldsProps<FormType> {
  email: keyof FormType;
  firstname: keyof FormType;
  gdpr: keyof FormType;
  isStaff?: boolean;
  lastname: keyof FormType;
  phoneNumber: keyof FormType;
}

type FakeFormType = {
  _: string;
};
type FakeKey = keyof FakeFormType;

export const DeclarantFields = <FormType extends SimpleObject>({
  firstname,
  lastname,
  phoneNumber,
  email,
  gdpr,
  isStaff = false,
}: DeclarantFieldsProps<FormType>) => {
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext<FakeFormType>();

  const firstnameKey = firstname as FakeKey;
  const lastnameKey = lastname as FakeKey;
  const phoneNumberKey = phoneNumber as FakeKey;
  const emailKey = email as FakeKey;
  const gdprKey = gdpr as FakeKey;

  return (
    <>
      <Grid haveGutters>
        <GridCol sm={6}>
          <Input
            label="Nom du déclarant"
            state={errors[lastnameKey] && "error"}
            stateRelatedMessage={errors[lastnameKey]?.message}
            nativeInputProps={register(lastnameKey)}
          />
        </GridCol>
        <GridCol sm={6}>
          <Input
            label="Prénom du déclarant"
            state={errors[firstnameKey] && "error"}
            stateRelatedMessage={errors[firstnameKey]?.message}
            nativeInputProps={register(firstnameKey)}
          />
        </GridCol>

        <GridCol sm={12}>
          <Input
            label={
              <>
                Téléphone du déclarant
                {isStaff && (
                  <Button
                    size="small"
                    type="button"
                    priority="tertiary no outline"
                    iconId="ri-phone-fill"
                    onClick={() => setValue(phoneNumberKey, "0122334455", { shouldValidate: true })}
                    className={cx(fr.cx("fr-mb-n1w", "fr-ml-1w"), "align-sub")}
                  >
                    Staff : Remplir
                  </Button>
                )}
              </>
            }
            hintText="Format attendu : 0122334455"
            state={errors[phoneNumberKey] && "error"}
            stateRelatedMessage={errors[phoneNumberKey]?.message}
            nativeInputProps={{
              ...register(phoneNumberKey),
              minLength: 10,
              maxLength: 10,
            }}
          />
        </GridCol>
      </Grid>

      <Input
        label="Email du déclarant"
        hintText={isStaff ? "Modifiable en tant que staff" : "Saisi lors de l'authentification"}
        state={errors[emailKey] && "error"}
        stateRelatedMessage={errors[emailKey]?.message}
        nativeInputProps={{
          ...register(emailKey),
          type: "email",
          readOnly: !isStaff,
        }}
        disabled={!isStaff}
      />

      <Checkbox
        options={[
          {
            label:
              "J'accepte l'utilisation de mes données à caractère personnel pour réaliser des statistiques et pour vérifier la validité de ma déclaration.",

            nativeInputProps: register(gdprKey),
            hintText: (
              <>
                Pour en savoir plus sur l'usage de ces données, vous pouvez consulter nos{" "}
                <Link href="/cgu" target="_blank">
                  Conditions Générales d'Utilisation
                </Link>
                .
              </>
            ),
          },
        ]}
        state={errors[gdprKey] && "error"}
        stateRelatedMessage={errors[gdprKey]?.message}
      />
    </>
  );
};
