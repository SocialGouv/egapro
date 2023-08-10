import { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup, { type ButtonsGroupProps } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { type Any } from "@common/utils/types";

type ButtonType = ButtonsGroupProps["buttons"][number]["type"];
export type BackNextButtonsGroupProps = {
  backDisabled?: boolean;
  /**
   * @default "Précédent"
   */
  backLabel?: string;
  backProps?: Partial<ButtonProps>;
  /**
   * @default "button"
   */
  backType?: ButtonType;
  className?: CxArg;
  nextDisabled?: boolean;
  /**
   * @default "Suivant"
   */
  nextLabel?: string;
  nextProps?: Partial<ButtonProps>;
  /**
   * @default "submit"
   */
  nextType?: ButtonType;
} & (
  | {
      /**
       * @deprecated Can't be used with `noNext`
       */
      noBack?: never;
      noNext?: boolean;
    }
  | {
      noBack?: boolean;
      /**
       * @deprecated Can't be used with `noBack`
       */
      noNext?: never;
    }
);

/**
 * Ready to use back/next buttons group for forms.
 */
export const BackNextButtonsGroup = ({
  backDisabled,
  backLabel = "Précédent",
  backProps,
  backType = "button",
  className,
  nextDisabled,
  nextLabel = "Suivant",
  nextProps,
  nextType = "submit",
  noBack,
  noNext,
}: BackNextButtonsGroupProps) => {
  if (noBack && noNext) throw new Error("You must provide at least one button");
  return (
    <ButtonsGroup
      className={cx(className)}
      inlineLayoutWhen="sm and up"
      buttonsEquisized
      buttons={
        [
          ...(noBack
            ? []
            : [
                {
                  children: backLabel,
                  priority: "secondary",
                  type: backType,
                  disabled: backDisabled,
                  iconId: "fr-icon-arrow-left-line",
                  iconPosition: "left",
                  ...((backProps ?? {}) as Any),
                } satisfies ButtonProps,
              ]),
          ...(noNext
            ? []
            : [
                {
                  children: nextLabel,
                  type: nextType,
                  disabled: nextDisabled,
                  iconId: "fr-icon-arrow-right-line",
                  iconPosition: "right",
                  ...((nextProps ?? {}) as Any),
                } satisfies ButtonProps,
              ]),
        ] as ButtonsGroupProps["buttons"]
      }
    />
  );
};
