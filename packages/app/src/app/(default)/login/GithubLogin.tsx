"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export interface GithubLoginProps {
  callbackUrl: string;
}

const code = ["s", "t", "a", "f", "f"];
export const GithubLogin = ({ callbackUrl }: GithubLoginProps) => {
  const [display, setDisplay] = useState(false);

  useEffect(() => {
    let count = 0;
    const cb = (e: KeyboardEvent) => {
      if (count === code.length) return;
      if (e.key === code[count]) {
        count++;
        if (count === code.length) {
          setDisplay(true);
        }
      } else {
        count = 0;
      }
    };
    document.addEventListener("keypress", cb);

    return () => {
      document.removeEventListener("keypress", cb);
    };
  }, []);
  return (
    <Button
      className={cx({ hidden: !display })}
      iconId="fr-icon-user-star-fill"
      onClick={e => {
        e.preventDefault();
        signIn("github", { callbackUrl });
      }}
      size="small"
    >
      Staff login
    </Button>
  );
};
