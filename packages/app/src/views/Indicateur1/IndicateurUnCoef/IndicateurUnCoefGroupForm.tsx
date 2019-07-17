/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment, useState } from "react";
import { Form } from "react-final-form";
import arrayMutators from "final-form-arrays";
import { FieldArray } from "react-final-form-arrays";
import {
  GroupeCoefficient,
  ActionIndicateurUnCoefData,
  FormState
} from "../../../globals";

import globalStyles from "../../../utils/globalStyles";

import {
  useColumnsWidth,
  useLayoutType
} from "../../../components/GridContext";
import ActionLink from "../../../components/ActionLink";
import ButtonAction from "../../../components/ButtonAction";
import ActionBar from "../../../components/ActionBar";
import FormAutoSave from "../../../components/FormAutoSave";
import FormSubmit from "../../../components/FormSubmit";
import { Modal } from "../../../components/ModalContext";

import InputField from "./components/CoefGroupInputField";
import ModalConfirmDelete from "./components/CoefGroupModalConfirmDelete";

interface Props {
  coefficient: Array<GroupeCoefficient>;
  readOnly: boolean;
  updateIndicateurUnCoefAddGroup: () => void;
  updateIndicateurUnCoefDeleteGroup: (index: number) => void;
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void;
  validateIndicateurUnCoefGroup: (valid: FormState) => void;
  navigateToEffectif: () => void;
}

function IndicateurUnCoefGroupForm({
  coefficient,
  readOnly,
  updateIndicateurUnCoefAddGroup,
  updateIndicateurUnCoefDeleteGroup,
  updateIndicateurUnCoef,
  validateIndicateurUnCoefGroup,
  navigateToEffectif
}: Props) {
  const initialValues = { groupes: coefficient };

  const saveForm = (formData: any) => {
    updateIndicateurUnCoef({ coefficient: formData.groupes });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurUnCoefGroup("Valid");
  };

  const layoutType = useLayoutType();
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7);

  const [indexGroupToDelete, setIndexGroupToDelete] = useState<
    number | undefined
  >(undefined);
  const confirmGroupToDelete = (index: number) => setIndexGroupToDelete(index);
  const closeModal = () => setIndexGroupToDelete(undefined);

  return (
    <Fragment>
      <Form
        onSubmit={onSubmit}
        mutators={{
          // potentially other mutators could be merged here
          ...arrayMutators
        }}
        initialValues={initialValues}
      >
        {({ handleSubmit, hasValidationErrors, submitFailed }) => (
          <form onSubmit={handleSubmit} css={[styles.container, { width }]}>
            <FormAutoSave saveForm={saveForm} />

            <FieldArray name="groupes">
              {({ fields }) => (
                <Fragment>
                  {fields.map((name, index) => (
                    <InputField
                      key={name}
                      name={`${name}.name`}
                      index={index}
                      deleteGroup={confirmGroupToDelete}
                      readOnly={readOnly}
                    />
                  ))}
                </Fragment>
              )}
            </FieldArray>

            {readOnly ? (
              <div css={styles.spacerAdd} />
            ) : (
              <ActionLink
                onClick={updateIndicateurUnCoefAddGroup}
                style={styles.add}
              >
                <div css={styles.addIcon}>
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 26 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.9992 24.174V1.82597M1.8252 13H24.1733"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span>ajouter un niveau ou coefficient hiérarchique</span>
              </ActionLink>
            )}

            {readOnly ? (
              <ActionBar>
                <ButtonAction onClick={navigateToEffectif} label="suivant" />
                <div css={styles.spacerActionBar} />
                <ActionLink
                  onClick={() => validateIndicateurUnCoefGroup("None")}
                >
                  modifier les groupes
                </ActionLink>
              </ActionBar>
            ) : (
              <ActionBar>
                {coefficient.length > 0 && (
                  <FormSubmit
                    hasValidationErrors={hasValidationErrors}
                    submitFailed={submitFailed}
                    errorMessage="Les groupes ne peuvent pas être validés si tous les champs ne sont pas remplis."
                  />
                )}
              </ActionBar>
            )}
          </form>
        )}
      </Form>

      <Modal
        isOpen={indexGroupToDelete !== undefined}
        onRequestClose={closeModal}
      >
        <ModalConfirmDelete
          closeModal={closeModal}
          deleteGroup={() => {
            indexGroupToDelete !== undefined &&
              updateIndicateurUnCoefDeleteGroup(indexGroupToDelete);
          }}
        />
      </Modal>
    </Fragment>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  }),

  add: css({
    display: "flex",
    alignItems: "center",
    marginTop: 46 - 18 - 5,
    textDecoration: "none"
  }),
  addIcon: css({
    width: 32,
    height: 32,
    marginRight: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: globalStyles.colors.default,
    borderRadius: 16
  }),

  spacerActionBar: css({
    width: 66
  }),
  spacerAdd: css({
    height: 32,
    marginTop: 46 - 18 - 5
  })
};

export default IndicateurUnCoefGroupForm;
