import { add, isAfter } from "date-fns";
import { Alert, AlertTitle } from "../design-system/base/Alert";
import { Link } from "../design-system/base/Link";
import { LinkGroup } from "../design-system/base/LinkGroup";
import { useFormManager } from "@services/apiClient";

export const AlertEdition = () => {
  const { formData } = useFormManager();

  if (formData.status !== "edition") return null;

  const olderThanOneYear = !formData.date ? undefined : isAfter(new Date(), add(new Date(formData.date), { years: 1 }));

  return (
    <Alert type="warning" size="sm" mb="4w">
      <AlertTitle>Attention</AlertTitle>
      {olderThanOneYear ? (
        <p>
          Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé.
        </p>
      ) : (
        <p>
          Vous êtes en train de modifier une déclaration validée et transmise. Vos modifications ne seront enregistrées
          que lorsque vous l'aurez à nouveau validée et transmise à la dernière étape.
        </p>
      )}
      <LinkGroup>
        <Link
          href={`/representation-equilibree/${formData.entreprise?.siren}/${formData.year}`}
          iconRight="fr-icon-arrow-right-line"
        >
          Revenir au récapitulatif
        </Link>
      </LinkGroup>
    </Alert>
  );
};
