import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { type PropsWithChildren } from "react";

export type Message = {
  description: JSX.Element;
  title?: string;
  type: "error" | "success";
};

type Props = {
  message?: Message;
};

export const GlobalMessage = ({ message }: PropsWithChildren<Props>) => {
  if (!message) return null;

  return (
    <>
      <ClientAnimate>
        <Alert
          severity={message.type}
          title={message.title || ""}
          small={false}
          description={message.description}
          className={fr.cx("fr-mb-4w")}
        />
      </ClientAnimate>
    </>
  );
};
