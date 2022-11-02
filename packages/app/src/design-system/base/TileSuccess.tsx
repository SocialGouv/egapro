import clsx from "clsx";
import type { PropsWithChildren } from "react";
import styles from "./TileSuccess.module.css";

export const TileSuccess = ({ children }: PropsWithChildren) => (
  <div className={clsx(styles.tile, "fr-p-2w fr-p-md-4w")}>
    <svg
      width="120"
      height="120"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="fr-mb-2w fr-mt-1w fr-mb-md-4w fr-mt-md-2w"
      focusable="false"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M68 13C67.4486 13 67 12.5514 67 12C67 11.4486 67.4486 11 68 11C68.5514 11 69 11.4486 69 12C69 12.5514 68.5514 13 68 13Z"
        fill="#CACAFB"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M41 76C40.4486 76 40 75.5514 40 75C40 74.4486 40.4486 74 41 74C41.5514 74 42 74.4486 42 75C42 75.5514 41.5514 76 41 76Z"
        fill="#CACAFB"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 10C14.4486 10 14 9.5514 14 9C14 8.44855 14.4486 8 15 8C15.5514 8 16 8.44855 16 9C16 9.5514 15.5514 10 15 10Z"
        fill="#CACAFB"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M37.339 46.579L30.9569 39.0346L30.8344 38.9028C30.0717 38.1659 28.9148 38.1525 28.1534 38.8635C27.3498 39.614 27.278 40.8955 27.9905 41.7377L36.1866 51.4249C36.2388 51.4867 36.296 51.5441 36.3575 51.5966C36.9874 52.1347 37.9342 52.0602 38.4723 51.4303L56.0033 30.9071L56.114 30.7646C56.7123 29.9039 56.5987 28.7348 55.8536 28.0322C55.0395 27.2646 53.7782 27.3362 53.0493 28.1894L37.339 46.579Z"
        fill="#00A95F"
      />
      <path
        d="M11.4406 45.0358C8.65938 29.2629 19.1913 14.2218 34.9642 11.4406C44.9852 9.67361 55.0292 13.2682 61.6737 20.7262C62.041 21.1386 62.0046 21.7707 61.5922 22.1381C61.1798 22.5055 60.5477 22.469 60.1804 22.0566C53.9924 15.1111 44.6425 11.7649 35.3115 13.4102C20.6264 15.9996 10.8208 30.0034 13.4102 44.6885C15.9996 59.3736 30.0034 69.1792 44.6885 66.5898C59.3736 64.0004 69.1792 49.9967 66.5898 35.3115C66.4939 34.7676 66.8571 34.249 67.401 34.153C67.9449 34.0571 68.4635 34.4203 68.5594 34.9642C71.3406 50.7371 60.8087 65.7782 45.0358 68.5594C29.2629 71.3406 14.2218 60.8087 11.4406 45.0358Z"
        fill="#000091"
      />
      <path
        d="M70.224 46.9243C70.3468 46.3859 70.8829 46.049 71.4214 46.1718C71.9598 46.2946 72.2967 46.8307 72.1739 47.3691C70.8288 53.2654 67.8823 58.6503 63.6928 62.9707C63.3084 63.3671 62.6753 63.3769 62.2788 62.9924C61.8823 62.6079 61.8726 61.9749 62.257 61.5784C66.1933 57.5191 68.9609 52.4613 70.224 46.9243Z"
        fill="#000091"
      />
      <path
        d="M72 42C71.4477 42 71 42.4477 71 43C71 43.5523 71.4477 44 72 44C72.5523 44 73 43.5523 73 43C73 42.4477 72.5523 42 72 42Z"
        fill="#000091"
      />
    </svg>
    {children}
  </div>
);

export type TileSuccessTitleProps = PropsWithChildren<{
  className?: string;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

export const TileSuccessTitle = ({ children, className, titleAs: HtmlTag = "p" }: TileSuccessTitleProps) => {
  return <HtmlTag className={clsx("fr-h3", className)}>{children}</HtmlTag>;
};