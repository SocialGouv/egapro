import Alert from "@codegouvfr/react-dsfr/Alert";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

import { EntrepriseUESForm } from "./EntrepriseUESForm";
import { InformationEntreprise } from "./InformationEntreprise";

const title = "Informations de l'entreprise / UES";

const InformationsEntreprisePage = () => {
  return (
    <>
      <Breadcrumb
        currentPageLabel={title}
        homeLinkProps={{
          href: "/",
        }}
        segments={[
          {
            linkProps: {
              href: "/too",
            },
            label: "Index",
          },
        ]}
      />

      <Stepper currentStep={2} nextTitle="Informations calcul et période de référence" stepCount={3} title={title} />

      <Alert
        severity="info"
        small={true}
        description={
          <>
            Concernant la tranche d'effectifs assujettis, l’assujettissement de l’entreprise ou de l'unité économique et
            sociale (UES) est défini à la date de l'obligation de publication de l'index, soit le 1er mars. Le calcul
            des effectifs assujettis de l’entreprise ou de l'unité économique et sociale (UES) est celui prévu aux
            articles L.1111-2 et L.1111-3 du code du travail.
          </>
        }
        className={cx("fr-mb-4w")}
      />

      <InformationEntreprise />

      <div className={cx("fr-mt-4w")}></div>

      <EntrepriseUESForm />
    </>
  );
};

export default InformationsEntreprisePage;
