"use client";

import { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { useRouter } from "next/navigation";

const limits = [10, 50, 100] as const;

export interface SelectLimitProps {
  currentLimit: number;
}
export const SelectLimit = ({ currentLimit = limits[0] }: SelectLimitProps) => {
  const router = useRouter();

  return (
    <ButtonsGroup
      inlineLayoutWhen="always"
      buttonsSize="small"
      alignment="right"
      buttons={[
        {
          children: "Limit",
          disabled: true,
          priority: "tertiary no outline",
          className: "!cursor-default",
          iconId: "fr-icon-arrow-right-line",
          iconPosition: "right",
        },
        ...limits.map<ButtonProps>(limit => ({
          children: limit,
          priority: limit === currentLimit ? "tertiary" : "tertiary no outline",
          type: "button",
          nativeButtonProps: {
            onClick() {
              if (limit === currentLimit) return;
              const url = new URL(location.href);
              url.searchParams.set("limit", limit.toString());
              router.replace(url.toString(), { scroll: false });
            },
          },
        })),
      ]}
    />
  );
};
