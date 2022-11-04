/* eslint-disable no-unused-labels */
/* eslint-disable @typescript-eslint/no-empty-function */
export const useFormManagerMock = () => {
  return {
    useFormManager: () => {
      return {
        saveFormData: () => {},
        formData: {},
      };
    },
  };
};
