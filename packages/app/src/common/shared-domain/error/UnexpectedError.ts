import { AppError } from "./AppError";

export class UnexpectedError extends AppError {}

export class UnexpectedRepositoryError extends UnexpectedError {}
