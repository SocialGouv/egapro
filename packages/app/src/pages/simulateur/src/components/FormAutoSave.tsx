import React from "react"
import { FormSpy } from "react-final-form"

function FormAutoSave({
  saveForm,
  onlyWhenDirty = true, // Only auto save when the form is dirty (some value changed from the initialization).
}: {
  saveForm: (values: any) => void
  onlyWhenDirty?: boolean
}) {
  const onChangeForm = ({ values, dirty }: { values: any; dirty: boolean }) => {
    if (dirty || (onlyWhenDirty !== undefined && !onlyWhenDirty)) {
      saveForm(values)
    }
  }

  return <FormSpy subscription={{ values: true, dirty: true }} onChange={onChangeForm} />
}

export default FormAutoSave
