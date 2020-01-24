/** @jsx jsx */
import { useState, ChangeEvent } from "react";
import { css, jsx } from "@emotion/core";
import { Field } from "react-final-form";

import { EntrepriseUES } from "../globals";

import globalStyles from "../utils/globalStyles";

import { mustBeNumber, required } from "../utils/formHelpers";

import ModalConfirmDelete from "../views/InformationsEntreprise/components/EntrepriseUESModalConfirmDelete";
import { Modal } from "./ModalContext";

export const validate = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  const mustBeAtLeastTwoError =
    !requiredError && !mustBeNumberError && Number(value) < 2;
  if (!requiredError && !mustBeNumberError && !mustBeAtLeastTwoError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeNumber: mustBeNumberError,
      mustBeAtLeastTwo: mustBeAtLeastTwoError
    };
  }
};

function NombreEntreprises({
  errorText,
  fieldName,
  label,
  readOnly,
  entreprisesUES
}: {
  errorText: string;
  fieldName: string;
  label: string;
  readOnly: boolean;
  entreprisesUES: Array<EntrepriseUES>;
}) {
  const [changeEvent, setChangeEvent] = useState<
    { input: any; event: ChangeEvent<any> } | undefined
  >(undefined);
  const confirmChangeEvent = (input: any, event: ChangeEvent<any>) => {
    event.persist();
    setChangeEvent({ input, event });
  };
  const closeModal = () => setChangeEvent(undefined);

  return (
    <Field name={fieldName} validate={validate}>
      {({ input, meta }) => (
        <div css={styles.formField}>
          <label
            css={[
              styles.label,
              meta.error && meta.touched && styles.labelError
            ]}
            htmlFor={input.name}
          >
            {label}
          </label>
          <div css={styles.fieldRow}>
            <input
              css={[
                styles.input,
                meta.error && meta.touched && styles.inputError
              ]}
              {...input}
              readOnly={readOnly}
              onChange={event => {
                const newValue = event.target.value;
                const newSize = Number.isNaN(Number(newValue))
                  ? 0
                  : Number(newValue);
                if (
                  validate(newValue) !== undefined || // Si invalide, sera bloqué au niveau de la validation du champ dans RFF
                  newSize >= entreprisesUES.length
                ) {
                  input.onChange(event);
                } else {
                  confirmChangeEvent(input, event);
                }
              }}
            />
          </div>
          {meta.error && meta.touched && <p css={styles.error}>{errorText}</p>}
          <Modal isOpen={changeEvent !== undefined} onRequestClose={closeModal}>
            <ModalConfirmDelete
              closeModal={closeModal}
              sendChangeEvent={() => {
                // TODO : the event isn't properly fired, the value doesn't change
                changeEvent !== undefined &&
                  changeEvent.input.onChange(changeEvent.event);
              }}
            />
          </Modal>
        </div>
      )}
    </Field>
  );
}

const styles = {
  formField: css({
    marginBottom: 20
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px"
  }),
  labelError: css({
    color: globalStyles.colors.error
  }),
  input: css({
    appearance: "none",
    border: `solid ${globalStyles.colors.default} 1px`,
    width: "100%",
    fontSize: 14,
    lineHeight: "17px",
    paddingLeft: 22,
    paddingRight: 22
  }),
  inputError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    input: {
      borderRadius: 4,
      border: "1px solid"
    },
    "input[readonly]": { border: 0 }
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px"
  })
};

export default NombreEntreprises;
