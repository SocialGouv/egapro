import { type NoStringReactNode, type PropsWithoutChildren } from "@common/utils/types";
import { type ModalInstance } from "@gouvfr/dsfr";
import { type ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

import { Container } from "../../layout/Container";
import { type IconStyle } from "../../utils/icon-styles";
import { Box } from "../Box";
import { ButtonGroup } from "../ButtonGroup";
import { FormButton } from "../FormButton";
import { Grid, GridCol } from "../Grid";
import { Icon } from "../Icon";

export type ModalProps = JSX.IntrinsicElements["dialog"] & {
  backdropCanClose?: boolean;
  buttons?: (param: { closableProps: ClosableModalButtonProps; instance?: ModalInstance }) => ReactNode[];
  content: ReactNode;
  icon?: IconStyle | NoStringReactNode;
  id: string;
  onClose?: (event: GlobalEventHandlersEventMap["dsfr.conceal"]) => void;
  onOpen?: (event: GlobalEventHandlersEventMap["dsfr.disclose"]) => void;
  size?: "lg" | "sm";
  title: ReactNode;
};

export type ClosableModalButtonProps = { "aria-controls": string };

/**
 * @deprecated use react-dsfr Modal insead
 */
export const Modal = ({
  onClose,
  onOpen,
  title,
  icon,
  content,
  buttons: buttonsMaker,
  size,
  id,
  backdropCanClose = true,
  ...rest
}: PropsWithoutChildren<ModalProps>) => {
  const titleId = `fr-modal-title-modal-${useId()}`;
  const loaded = typeof window !== "undefined";
  const dsfr = () => (loaded ? window.dsfr : null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (loaded) {
      const current = dialogRef.current;
      onClose && current?.addEventListener("dsfr.conceal", onClose);
      onOpen && current?.addEventListener("dsfr.disclose", onOpen);

      return () => {
        onClose && current?.removeEventListener("dsfr.conceal", onClose);
        onOpen && current?.removeEventListener("dsfr.disclose", onOpen);
      };
    }
  }, [loaded, onClose, onOpen]);

  const colSize = size === "sm" ? 4 : size === "lg" ? 8 : 6;

  const buttons = buttonsMaker?.({
    closableProps: { "aria-controls": id },
    instance: dialogRef.current ? dsfr()?.(dialogRef.current).modal : void 0,
  });

  return (
    <dialog
      {...rest}
      ref={dialogRef}
      id={id}
      className="fr-modal"
      aria-labelledby={titleId}
      role="dialog"
      data-fr-concealing-backdrop={backdropCanClose}
    >
      <Container className="fr-container--fluid fr-container-md">
        <Grid align="center">
          <GridCol md={colSize} lg={colSize}>
            <Box className="fr-modal__body">
              <Box className="fr-modal__header">
                <FormButton type="button" variant="close" title="Fermer" aria-controls={id}>
                  Fermer
                </FormButton>
              </Box>
              <Box className="fr-modal__content">
                <h1 className="fr-modal__title" id={titleId}>
                  {icon && typeof icon === "string" ? <Icon icon={icon as IconStyle} size="lg" /> : icon}
                  {title}
                </h1>
                {typeof content === "string" ? <p>{content}</p> : content}
              </Box>
              {buttons?.length && (
                <Box className="fr-modal__footer">
                  <ButtonGroup iconPosition="left" position="right" as="ul" inline="desktop-up">
                    {buttons.map((el, index) => (
                      <li key={index}>{el}</li>
                    ))}
                  </ButtonGroup>
                </Box>
              )}
            </Box>
          </GridCol>
        </Grid>
      </Container>
    </dialog>
  );
};
