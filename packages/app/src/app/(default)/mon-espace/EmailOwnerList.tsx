"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Icon } from "@design-system";
import { useRouter } from "next/navigation";

import { removeSirens } from "./actions";

export const EmailOwnerList = ({
  isEmailLogin,
  emails,
  siren,
}: {
  emails: string[];
  isEmailLogin: boolean;
  siren: string;
}) => {
  const router = useRouter();
  return (
    <ul>
      {emails.map((email, index) => (
        <li className={fr.cx("fr-btns-group")} key={`owner-${index}`}>
          {email}
          {isEmailLogin && (
            <Icon
              className={fr.cx("fr-ml-1w")}
              onClick={async () => {
                if (confirm(`Voulez-vous vraiment supprimer ${email} ?`)) {
                  await removeSirens(email, [siren]);
                  router.refresh();
                }
              }}
              size="sm"
              icon="fr-icon-delete-line"
            />
          )}
        </li>
      ))}
    </ul>
  );
};
