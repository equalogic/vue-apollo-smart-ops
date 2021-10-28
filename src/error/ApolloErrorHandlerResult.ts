import {
  ApolloErrorType,
  InputValidationError,
  NetworkError,
  ProcessedApolloError,
  ServerError,
  UnauthorizedError,
  UserInputError,
  ValidationRuleViolation,
} from './types';

export interface ApolloErrorHandlerResultInterface {
  processedErrors: ProcessedApolloError[];
  validationRuleViolations?: ValidationRuleViolation[];
}

export class ApolloErrorHandlerResult implements ApolloErrorHandlerResultInterface {
  public constructor(
    public readonly processedErrors: ProcessedApolloError[],
    public readonly handledErrors: ProcessedApolloError[],
  ) {}

  public get networkErrors(): NetworkError[] {
    return this.processedErrors.filter((e): e is NetworkError => e.type === ApolloErrorType.NETWORK_ERROR);
  }

  public get serverErrors(): ServerError[] {
    return this.processedErrors.filter((e): e is ServerError => e.type === ApolloErrorType.SERVER_ERROR);
  }

  public get unauthorizedErrors(): UnauthorizedError[] {
    return this.processedErrors.filter((e): e is UnauthorizedError => e.type === ApolloErrorType.UNAUTHORIZED_ERROR);
  }

  public get userInputErrors(): UserInputError[] {
    return this.processedErrors.filter((e): e is UserInputError => e.type === ApolloErrorType.BAD_USER_INPUT);
  }

  public get inputValidationErrors(): InputValidationError[] {
    return this.processedErrors.filter(
      (e): e is InputValidationError => e.type === ApolloErrorType.INPUT_VALIDATION_ERROR,
    );
  }

  public get validationRuleViolations(): ValidationRuleViolation[] {
    return this.inputValidationErrors.flatMap(e => e.violations);
  }
}
