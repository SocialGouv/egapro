import { AppError } from "./AppError";

export class UnexpectedError extends AppError {}

export class UnexpectedRepositoryError extends UnexpectedError {}

export class UnexpectedMailerError extends UnexpectedError {}

export class UnexpectedSessionError extends UnexpectedError {}
