export const isNodeErrorNoException = (error: unknown): error is Required<NodeJS.ErrnoException> => {
  const maybeErrno = error as NodeJS.ErrnoException;
  return "errno" in maybeErrno && "syscall" in maybeErrno && "code" in maybeErrno;
};
