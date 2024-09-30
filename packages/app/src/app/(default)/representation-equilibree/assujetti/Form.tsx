"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import CallOut from "@codegouvfr/react-dsfr/CallOut";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type Any } from "@common/utils/types";
import { useEffect, useId, useState } from "react";

export const AssujettiForm = ({ title }: { title: string }) => {
  const [isAssujetti, setAssujetti] = useState(true);
  const defaultCheckedId = useId();

  useEffect(() => {
    // TODO remove
    // hack because intial checked is "removed" by Next for whatever reasons
    // https://github.com/vercel/next.js/issues/49499
    (document.querySelector(`[data-default-checked="${defaultCheckedId}"]`) as Any).checked = true;
  }, [defaultCheckedId]);

  return (
    <>
      <form noValidate>
        <RadioButtons
          legend={title}
          classes={{
            legend: "fr-sr-only",
          }}
          options={[
            {
              label: "Oui, mon entreprise emploie au moins 1000 salariés pour le troisième exercice consécutif",
              nativeInputProps: {
                checked: isAssujetti,
                onChange() {
                  setAssujetti(true);
                },
                ...({
                  ["data-default-checked"]: defaultCheckedId,
                } as Any),
              },
            },
            {
              label: "Non, mon entreprise n'emploie pas au moins 1000 salariés pour le troisième exercice consécutif",
              nativeInputProps: {
                checked: !isAssujetti,
                onChange() {
                  setAssujetti(false);
                },
              },
            },
          ]}
        />
      </form>
      {isAssujetti ? (
        <Button
          linkProps={{ href: "/representation-equilibree/commencer" }}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
        >
          Suivant
        </Button>
      ) : (
        <CallOut
          buttonProps={{
            linkProps: {
              href: "/representation-equilibree",
            },
            children: "Retour à la page d'accueil",
          }}
        >
          Votre entreprise n'est pas concernée, vous ne devez pas déclarer à l'administration les écarts éventuels de
          représentation.
        </CallOut>
      )}
    </>
  );
};
