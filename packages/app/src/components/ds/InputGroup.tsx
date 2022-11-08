import type { FormControlProps } from "@chakra-ui/react";
import { Box, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, VisuallyHidden } from "@chakra-ui/react";
import type { FieldMetaState } from "react-final-form";
import { Field } from "react-final-form";

import { ActivityIndicator } from "./ActivityIndicator";

export type InputGroupProps = FormControlProps & {
  autocomplete?: string;
  fieldName: string;
  hasError?: boolean;
  isLabelHidden?: boolean;
  isLoading?: boolean;
  label: string;
  message?: {
    error?: React.ReactElement | string;
    help?: React.ReactElement | string;
  };
  placeholder?: string;
};

export const isFieldHasError = (meta: FieldMetaState<string>) =>
  (meta.error && meta.submitFailed) ||
  (meta.error && meta.touched && Object.values({ ...meta.error, required: false }).includes(true));

export const InputGroup = ({
  isLabelHidden,
  label,
  fieldName,
  message,
  autocomplete,
  isLoading,
  hasError,
  placeholder,
  ...rest
}: InputGroupProps) => {
  const msgStyle = { flexDirection: "column", alignItems: "flex-start" };
  return (
    <Field name={fieldName} component="input">
      {({ input, meta }) => (
        <FormControl isInvalid={hasError || isFieldHasError(meta)} {...rest}>
          <FormLabel htmlFor={input.name}>{isLabelHidden ? <VisuallyHidden>{label}</VisuallyHidden> : label}</FormLabel>
          <Box position="relative">
            <Input id={input.name} autoComplete={autocomplete} placeholder={placeholder} {...input} />
            {isLoading && (
              <Box position="absolute" right={2} top={2} zIndex={2} pointerEvents="none">
                <ActivityIndicator />
              </Box>
            )}
          </Box>
          {message?.help && <FormHelperText sx={msgStyle}>{message.help}</FormHelperText>}
          {message?.error && <FormErrorMessage sx={msgStyle}>{message.error}</FormErrorMessage>}
        </FormControl>
      )}
    </Field>
  );
};
