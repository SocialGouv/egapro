import { config } from "@common/config";
import { format } from "date-fns";
import { NextLinkOrA } from "packages/app/src/design-system/utils/NextLinkOrA";

const downloadUrl = new URL("/dgt-export-representation.xlsx", config.host).toString();
export const DownloadFileZone = async () => {
  const response = await fetch(downloadUrl, { method: "HEAD" });

  const lastModified = response.headers.get("last-modified");
  const contentLength = response.headers.get("content-length");

  if (!response.ok || !lastModified || !contentLength) {
    return null;
  }

  const formattedLastModified = format(new Date(lastModified), "dd/MM/yyyy");
  const roundedContentLength = Math.round(Number(contentLength) / 1000);

  return (
    <p className="fr-mt-3w">
      <NextLinkOrA isExternal href={downloadUrl}>
        Télécharger le fichier XSLX des représentations équilibrées au {formattedLastModified} ({roundedContentLength}
        Ko)
      </NextLinkOrA>
    </p>
  );
};
