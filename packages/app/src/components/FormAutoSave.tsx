import React from "react";
import { FormSpy } from "react-final-form";

function FormAutoSave({ saveForm }: { saveForm: (values: any) => void }) {
  const onChangeForm = ({ values, dirty }: { values: any; dirty: boolean }) => {
    if (dirty) {
      saveForm(values);
    }
  };

  return (
    <FormSpy
      subscription={{ values: true, dirty: true }}
      onChange={onChangeForm}
    />
  );
}

export default FormAutoSave;
