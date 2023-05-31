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
              label: "Oui, je suis concerné",
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
              label: "Non, je ne suis pas concerné",
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
        <Button linkProps={{ href: "/representation-equilibree/commencer" }}>Suivant</Button>
      ) : (
        <CallOut
          buttonProps={{
            linkProps: {
              href: "/representation-equilibree",
            },
            children: "Retour à la page d'acceuil",
          }}
        >
          Vous n'êtes pas assujetti à la publication et à la déclaration des écarts éventuels de représentation entre
          les femmes et les hommes.
        </CallOut>
      )}
    </>
  );
};
