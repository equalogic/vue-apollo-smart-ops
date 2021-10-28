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
  allErrors: ProcessedApolloError[];
  validationRuleViolations?: ValidationRuleViolation[];
}

export class ApolloErrorHandlerResult implements ApolloErrorHandlerResultInterface {
  public readonly allErrors: ProcessedApolloError[];

  public constructor(
    public readonly unhandledErrors: ProcessedApolloError[],
    public readonly handledErrors: ProcessedApolloError[],
  ) {
    this.allErrors = [...unhandledErrors, ...handledErrors];
  }

  public get networkErrors(): NetworkError[] {
    return this.allErrors.filter((e): e is NetworkError => e.type === ApolloErrorType.NETWORK_ERROR);
  }

  public get serverErrors(): ServerError[] {
    return this.allErrors.filter((e): e is ServerError => e.type === ApolloErrorType.SERVER_ERROR);
  }

  public get unauthorizedErrors(): UnauthorizedError[] {
    return this.allErrors.filter((e): e is UnauthorizedError => e.type === ApolloErrorType.UNAUTHORIZED_ERROR);
  }

  public get userInputErrors(): UserInputError[] {
    return this.allErrors.filter((e): e is UserInputError => e.type === ApolloErrorType.BAD_USER_INPUT);
  }

  public get inputValidationErrors(): InputValidationError[] {
    return this.allErrors.filter((e): e is InputValidationError => e.type === ApolloErrorType.INPUT_VALIDATION_ERROR);
  }

  public get validationRuleViolations(): ValidationRuleViolation[] {
    return this.inputValidationErrors.flatMap(e => e.violations);
  }
}
