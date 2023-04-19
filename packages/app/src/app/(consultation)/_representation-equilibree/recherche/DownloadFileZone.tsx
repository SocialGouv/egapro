import { fr } from "@codegouvfr/react-dsfr";
import { Download } from "@codegouvfr/react-dsfr/Download";
import { config } from "@common/config";
import { format } from "date-fns";

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
    <Download
      className={fr.cx("fr-mt-3w")}
      label={`Télécharger le fichier des représentations équilibrées au ${formattedLastModified}`}
      details={`XLSX - ${roundedContentLength}Ko`}
      linkProps={{ href: downloadUrl }}
    />
  );
};
