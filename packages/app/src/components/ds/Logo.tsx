import { Image } from "@chakra-ui/react";
import type { FC } from "react";
import React from "react";

export type LogoProps = Record<string, unknown>;

export const Logo: FC<LogoProps> = () => {
  return (
    <Image
      src={"/consulter-index/icons/marianne.svg"}
      alt="Aller à la page d'accueil du Ministère du travail, de l'emploi et de l'insertion"
      width={88}
    />
  );
};
