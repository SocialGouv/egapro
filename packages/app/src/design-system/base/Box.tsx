import clsx from "clsx";
import type { ReactNode } from "react";

import type { MarginProps } from "design-system/utils/spacing";

export type BoxProps = MarginProps &
  React.HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
    className?: string;
  };

export const Box = ({ className, mt, mr, mb, ml, mx, my, pt, pr, pb, pl, px, py, children, ...rest }: BoxProps) => {
  return (
    <div
      className={clsx(
        mt && `fr-mt-md-${mt}`,
        mb && `fr-mb-md-${mb}`,
        ml && `fr-ml-md-${ml}`,
        mr && `fr-mr-md-${mr}`,
        mx && `fr-mx-md-${mx}`,
        my && `fr-my-md-${my}`,
        pt && `fr-pt-md-${pt}`,
        pb && `fr-pb-md-${pb}`,
        pl && `fr-pl-md-${pl}`,
        pr && `fr-pr-md-${pr}`,
        px && `fr-px-md-${px}`,
        py && `fr-py-md-${py}`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
