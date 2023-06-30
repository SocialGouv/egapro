"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Box } from "@design-system";
import { useRouter } from "next/navigation";
import { type ChangeEventHandler, useRef, useState, useTransition } from "react";

import { importFile } from "./actions";

const modal = createModal({
  id: "import-referents",
  isOpenedByDefault: false,
});

export const importReferentsModalButtonProps = modal.buttonProps;

export const ImportReferentsModal = () => {
  const router = useRouter();
  const [hasFile, setHasFile] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const submitRef = useRef<HTMLButtonElement>(null);

  const doImport = async (formData: FormData) => {
    if (!hasFile) return;
    setErrorMessage("");
    try {
      await importFile(formData);
      modal.close();
      router.refresh();
    } catch (error: unknown) {
      console.log(error);
      setErrorMessage((error as Error).message);
    }
  };

  const uploadToClient: ChangeEventHandler<HTMLInputElement> = event => {
    const file = event.target.files?.[0];
    if (file) {
      setHasFile(true);
    } else {
      setHasFile(false);
    }
  };

  return (
    <modal.Component
      title="Importer des référents"
      iconId="fr-icon-download-fill"
      concealingBackdrop={!isPending}
      buttons={[
        {
          children: "Importer",
          disabled: !hasFile || isPending,
          doClosesModal: false,
          onClick() {
            submitRef.current?.click();
          },
        },
      ]}
    >
      <Box>
        Importer depuis un fichier JSON une liste de référents.
        <br />
        Attention, cette opération remplacera les données existantes !
      </Box>
      <br />
      <form action={formData => startTransition(() => doImport(formData))}>
        <input disabled={isPending} type="file" accept=".json" name="file" onChange={uploadToClient} />
        <button ref={submitRef} style={{ display: "none" }} type="submit" />
      </form>
      {isPending && <Alert className={fr.cx("fr-mt-2w")} small severity="info" description="Uploading..." />}
      {errorMessage && <Alert className={fr.cx("fr-mt-2w")} small severity="error" description={errorMessage} />}
    </modal.Component>
  );
};
