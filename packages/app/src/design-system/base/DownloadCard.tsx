import Card from "@codegouvfr/react-dsfr/Card";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { type LinkProps } from "next/link";

import style from "./DownloadCard.module.scss";

export interface DownloadCardProps {
  className?: CxArg;
  desc: string;
  endDetail: string;
  fileType: string;
  filename: string;
  href: string;
  title: string;
}

export const DownloadCard = ({ className, desc, endDetail, fileType, filename, href, title }: DownloadCardProps) => (
  <Card
    enlargeLink
    title={title}
    endDetail={endDetail}
    linkProps={{
      href: href,
      download: filename,
      target: "_blank",
      type: fileType,
      rel: "noopener noreferrer",
    }}
    desc={desc}
    iconId="fr-icon-download-line"
    className={cx(style["download-icon"], className)}
  />
);
