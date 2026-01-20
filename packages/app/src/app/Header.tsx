import {
  Header as DsfrHeader,
  type HeaderProps as DsfrHeaderProps,
} from "@codegouvfr/react-dsfr/Header";
import { Brand } from "@components/Brand";

import { LoginLogoutHeaderItem, UserHeaderItem } from "./AuthHeaderItems";

export interface HeaderProps extends Pick<
  DsfrHeaderProps,
  "navigation" | "serviceTagline" | "serviceTitle"
> {
  auth?: boolean;
}

export const Header = ({
  auth,
  navigation,
  serviceTitle = "Egapro",
  serviceTagline = "Indicateurs d’égalité professionnelle femmes-hommes",
}: HeaderProps) => {
  return (
    <DsfrHeader
      brandTop={<Brand />}
      serviceTitle={serviceTitle}
      serviceTagline={serviceTagline}
      homeLinkProps={{
        href: "/",
        title:
          "Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion",
      }}
      navigation={navigation}
      quickAccessItems={
        auth
          ? [
              <UserHeaderItem key="hqai-user" />,
              <LoginLogoutHeaderItem key="hqai-loginlogout" />,
            ].filter(Boolean)
          : []
      }
    />
  );
};
