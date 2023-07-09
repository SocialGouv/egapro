export class AppError extends Error {
  constructor(
    message: string,
    public previousError?: Error,
  ) {
    super(message);
  }

  public appErrorStack() {
    return this.appErrorList().map(e => String(e.stack));
  }

  public appErrorList() {
    const errors: Error[] = [this];
    if (this.previousError) {
      if (this.previousError instanceof AppError) {
        errors.push(...this.previousError.appErrorList());
      } else errors.push(this.previousError);
    }

    return errors;
  }
}
