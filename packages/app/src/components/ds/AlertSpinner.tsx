import { Alert, AlertTitle, Spinner } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

export const AlertSpinner = ({ children }: PropsWithChildren) => {
  return (
    <Alert
      status="info"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="200px"
      mt={4}
      colorScheme="gray"
    >
      <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="lg" />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        {children}
      </AlertTitle>
    </Alert>
  );
};
