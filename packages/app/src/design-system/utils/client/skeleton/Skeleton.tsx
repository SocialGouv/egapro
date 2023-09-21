import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { Fragment, type PropsWithChildren, type ReactElement, useContext } from "react";

import { SkeletonThemeContext } from "./SkeletonThemeContext";
import { type SkeletonStyleProps } from "./types";

const defaultEnableAnimation = true;

// For performance & cleanliness, don't add any inline styles unless we have to
function styleOptionsToStyleJsx({
  baseColor,
  highlightColor,

  width,
  height,
  borderRadius,
  circle,

  direction,
  duration,
  enableAnimation = defaultEnableAnimation,
}: SkeletonStyleProps & { circle: boolean }) {
  const style: Record<string, string> = {};

  if (direction === "rtl") style["--animation-direction"] = "reverse";
  if (typeof duration === "number") style["--animation-duration"] = `${duration}s`;
  if (!enableAnimation) style["--pseudo-element-display"] = "none";

  if (typeof width === "string" || typeof width === "number")
    style.width = `${width}${typeof width === "number" ? "px" : ""}`;
  if (typeof height === "string" || typeof height === "number")
    style.height = `${height}${typeof height === "number" ? "px" : ""}`;

  if (typeof borderRadius === "string" || typeof borderRadius === "number") style["border-radius"] = `${borderRadius}`;

  if (circle) style["border-radius"] = "50%";

  if (typeof baseColor !== "undefined") style["--base-color"] = baseColor;
  if (typeof highlightColor !== "undefined") style["--highlight-color"] = highlightColor;

  return (
    <style jsx>{`
      .react-loading-skeleton {
        ${Object.entries(style)
          .map(([key, value]) => `${key}: ${value};`)
          .join("\n")}
      }
    `}</style>
  );
}

export interface SkeletonProps extends SkeletonStyleProps {
  circle?: boolean;
  className?: CxArg;

  containerClassName?: string;
  containerTestId?: string;
  count?: number;

  wrapper?: React.FunctionComponent<PropsWithChildren<unknown>>;
}

export function Skeleton({
  count = 1,
  wrapper: Wrapper,

  className: customClassName,
  containerClassName,
  containerTestId,

  circle = false,

  ...originalPropsStyleOptions
}: SkeletonProps) {
  const contextStyleOptions = useContext(SkeletonThemeContext);

  const propsStyleOptions = { ...originalPropsStyleOptions };

  // DO NOT overwrite style options from the context if `propsStyleOptions`
  // has properties explicity set to undefined
  for (const [key, value] of Object.entries(originalPropsStyleOptions)) {
    if (typeof value === "undefined") {
      delete propsStyleOptions[key as keyof typeof propsStyleOptions];
    }
  }

  // Props take priority over context
  const styleOptions = {
    ...contextStyleOptions,
    ...propsStyleOptions,
    circle,
  };

  const inline = styleOptions.inline ?? false;

  const elements: ReactElement[] = [];

  const countCeil = Math.ceil(count);

  for (let i = 0; i < countCeil; i++) {
    let currentWidth: number | string = styleOptions.width ?? "100%"; // 100% is the default since that's what's in the CSS

    if (countCeil > count && i === countCeil - 1) {
      // count is not an integer and we've reached the last iteration of
      // the loop, so add a "fractional" skeleton.
      //
      // For example, if count is 3.5, we've already added 3 full
      // skeletons, so now we add one more skeleton that is 0.5 times the
      // original width.

      const fractionalPart = count % 1;

      currentWidth =
        typeof currentWidth === "number" ? currentWidth * fractionalPart : `calc(${currentWidth} * ${fractionalPart})`;
    }

    const skeletonSpan = (
      <span className={cx("react-loading-skeleton", customClassName)} key={i}>
        {styleOptionsToStyleJsx({
          ...styleOptions,
          width: currentWidth,
        })}
        &zwnj;
      </span>
    );

    if (inline) {
      elements.push(skeletonSpan);
    } else {
      // Without the <br />, the skeleton lines will all run together if
      // `width` is specified
      elements.push(
        <Fragment key={i}>
          {skeletonSpan}
          <br />
        </Fragment>,
      );
    }
  }

  return (
    <span
      className={containerClassName}
      data-testid={containerTestId}
      aria-live="polite"
      aria-busy={styleOptions.enableAnimation ?? defaultEnableAnimation}
    >
      {Wrapper ? elements.map((el, i) => <Wrapper key={i}>{el}</Wrapper>) : elements}
    </span>
  );
}
