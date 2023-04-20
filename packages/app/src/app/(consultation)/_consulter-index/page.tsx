/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { config } from "@common/config";
import { Box, Heading } from "@design-system";
import { SimpleSubmitForm } from "@design-system/utils/client/SimpleSubmitForm";
import { DetailedDownload } from "packages/app/src/design-system/base/DetailedDownload";

const ConsulterIndex = () => {
  return (
    <>
      <Box as="section">
        <Heading as="h1" variant="h5" text="Rechercher l'index de l'égalité professionnelle d'une entreprise" />
        <SimpleSubmitForm action="/_consulter-index/recherche" noValidate>
          <SearchBar
            big
            label="Rechercher"
            nativeInputProps={{
              placeholder: "Nom ou numéro de SIREN de l'entreprise",
              name: "q",
            }}
          />
        </SimpleSubmitForm>
        {/* @ts-ignore */}
        <DetailedDownload
          href={new URL("/index-egalite-fh.xlsx", config.host).toString()}
          label={date => `Télécharger le fichier des entreprises au ${date}`}
        />
      </Box>
      <Box as="section" style={{ backgroundColor: "var(--background-alt-grey)" }}>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </Box>
    </>
  );
};

export default ConsulterIndex;
