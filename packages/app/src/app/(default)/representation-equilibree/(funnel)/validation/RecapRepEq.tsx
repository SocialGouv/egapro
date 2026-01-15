"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import {
  type CreateRepresentationEquilibreeDTO,
  createRepresentationEquilibreeDTO,
} from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { getAdditionalMeta } from "@common/core-domain/helpers/entreprise";
import { COUNTRIES_COG_TO_ISO } from "@common/dict";
import { storePicker } from "@common/utils/zustand";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { RecapCard } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";

import { times } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type ZodError } from "zod";
import { type Session } from "next-auth";

import { saveRepresentationEquilibree } from "../../actions";
import { DetailRepEq } from "../../Recap";
import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

function assertRepEq(
  repEq: Partial<CreateRepresentationEquilibreeDTO> | undefined,
): asserts repEq is CreateRepresentationEquilibreeDTO {
  createRepresentationEquilibreeDTO.parse(repEq);
}

const useStore = storePicker(useRepeqFunnelStore);
export const ValidationRecapRepEq = ({ session }: { session: Session }) => {
  const router = useRouter();
  const [company, setCompany] = useState<Entreprise | null>(null);
  const [funnel, setIsEdit] = useStore("funnel", "setIsEdit");
  const hydrated = useRepeqFunnelStoreHasHydrated();

  useEffect(() => {
    if (hydrated && !funnel?.siren) {
      router.push("/representation-equilibree/commencer");
      return;
    }

    if (funnel?.siren && session.user.entreprise?.siren === funnel.siren) {
      // Construct Entreprise from Etablissement
      const etab = session.user.entreprise;
      const shortEtab = {
        siret: etab.siret,
        etablissementSiege: etab.etablissementSiege,
        activitePrincipaleEtablissement: etab.activitePrincipaleEtablissement,
        address: etab.address,
        city: etab.city,
        postalCode: etab.postalCode,
        countryIsoCode: etab.countryIsoCode,
        codeCommuneEtablissement: etab.codeCommuneEtablissement,
        libelleCommuneEtablissement: etab.libelleCommuneEtablissement,
        categorieEntreprise: etab.categorieEntreprise,
      };
      const entreprise: Entreprise = {
        siren: etab.siren,
        label: `${etab.simpleLabel || ''} (${etab.siren})`,
        simpleLabel: etab.simpleLabel || '',
        highlightLabel: etab.simpleLabel || '',
        matching: 1,
        activitePrincipaleUniteLegale: etab.activitePrincipaleUniteLegale || '',
        categorieJuridiqueUniteLegale: etab.categorieJuridiqueUniteLegale || '',
        caractereEmployeurUniteLegale: etab.caractereEmployeurUniteLegale || '',
        etatAdministratifUniteLegale: etab.etatAdministratifUniteLegale || '',
        dateCreationUniteLegale: etab.dateCreationUniteLegale || '',
        dateDebut: '',
        etablissements: 1,
        conventions: [],
        allMatchingEtablissements: [shortEtab],
        firstMatchingEtablissement: shortEtab,
      };
      setCompany(entreprise);
    }
  }, [funnel, session.user.entreprise, hydrated, router]);
  if (!hydrated || !company) {
    return (
      <>
        <p>
          Déclaration des écarts de représentation Femmes‑Hommes pour l'année <Skeleton inline width="4ch" /> au titre
          des données <Skeleton inline width="4ch" /> .
        </p>
        {times(6).map(idx => (
          <RecapCard key={`recap-loading-${idx}`} title={<SkeletonFlex />} content={<Skeleton count={3} />} />
        ))}
      </>
    );
  }

  try {
    assertRepEq(funnel);
  } catch (e: unknown) {
    return <Alert severity="error" title="Données invalides" description={(e as ZodError).message} />;
  }

  const sendRepresentationEquilibree = async () => {
    await saveRepresentationEquilibree(funnel);
    setIsEdit(true);
    router.push("/representation-equilibree/transmission");
  };

  const previousPage =
    "notComputableReasonExecutives" in funnel && "notComputableReasonMembers" in funnel
      ? "/representation-equilibree/ecarts-membres"
      : "/representation-equilibree/publication";

  const { address, countryCodeCOG, countyCode, postalCode, regionCode } = getAdditionalMeta(company);
  const repEq: RepresentationEquilibreeDTO = {
    ...funnel,
    declaredAt: "",
    modifiedAt: "",
    company: {
      address: address?.includes("[ND]") ? "Information non diffusible" : address,
      city: company.firstMatchingEtablissement.libelleCommuneEtablissement?.includes("[ND]")
        ? ""
        : company.firstMatchingEtablissement.libelleCommuneEtablissement || "",
      countryCode: COUNTRIES_COG_TO_ISO[countryCodeCOG],
      county: countyCode ?? void 0,
      nafCode: company.activitePrincipaleUniteLegale,
      name: company.simpleLabel,
      postalCode: postalCode?.includes("[ND]") ? "" : postalCode ?? "",
      region: regionCode ?? void 0,
    },
  };
  return (
    <>
      <p>
        Déclaration des écarts de représentation Femmes‑Hommes pour l'année <strong>{funnel.year + 1}</strong> au titre
        des données <strong>{funnel.year}</strong>.
      </p>
      <DetailRepEq edit repEq={repEq} />
      <ButtonsGroup
        className={fr.cx("fr-mt-6w")}
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Précédent",
            priority: "secondary",
            linkProps: {
              href: previousPage,
            },
          },
          {
            children: "Valider et transmettre les résultats",
            onClick: sendRepresentationEquilibree,
          },
        ]}
      />
    </>
  );
};
