import Vue from 'vue';
import { ApolloOperationContext } from '../types';
import {
  ApolloError,
  ApolloErrorType,
  GraphQLError,
  InputValidationError,
  ProcessedApolloError,
  ServerError,
  UnauthorizedError,
} from './types';

export function isApolloError(error: ApolloError | any): error is ApolloError {
  return error.graphQLErrors !== undefined;
}

export function isGraphQLError(error: GraphQLError | any): error is GraphQLError {
  return error.extensions !== undefined;
}

export class ApolloErrorProcessor<TApp = Vue, TContext = ApolloOperationContext> {
  public static FriendlyMessages: Record<string, string> = {
    FAILED_TO_FETCH:
      'Unable to communicate with server. The service may be down or you may be offline. Try again in a moment.',
    INTERNAL_SERVER_ERROR: `A server error has occurred.`,
  };

  public processedErrors: ProcessedApolloError[];

  protected readonly originalError: Error;
  protected readonly app: TApp;
  protected readonly context: TContext;

  public constructor(error: ApolloError, app: TApp, context: TContext) {
    this.originalError = error;
    this.app = app;
    this.context = context;

    this.processedErrors = this.processApolloError(error);
  }

  public showErrorNotifications(): void {
    // This is just an example - to do something else (e.g. showing a visible notification to the user), you should
    // implement your own class that extends ApolloErrorProcessor and replace this showErrorNotifications method.
    this.processedErrors.forEach(error => {
      console.error(`${error.type}: ${error.message}`, error.error);
    });
  }

  public cleanError(error: ApolloError | GraphQLError | Record<string, any>): Error {
    if (error instanceof Error) {
      return error;
    }

    // the `error` object we have may not be an actual Error instance
    // create a new one suitable for e.g. capturing to Sentry
    const cleanError = new Error(error.message);

    if (isGraphQLError(error)) {
      cleanError.name = 'GraphQLError' + (error.extensions?.code != null ? `[${error.extensions.code}]` : '');
      cleanError.stack = this.originalError.stack;

      Object.defineProperty(cleanError, 'nodes', { value: error.nodes });
      Object.defineProperty(cleanError, 'source', { value: error.source });
      Object.defineProperty(cleanError, 'positions', { value: error.positions });
      Object.defineProperty(cleanError, 'path', { value: error.path });
      Object.defineProperty(cleanError, 'extensions', { value: JSON.stringify(error.extensions) });
      Object.defineProperty(cleanError, 'originalError', { value: this.originalError });
    } else {
      Object.keys(error).forEach(key => Object.defineProperty(cleanError, key, { value: error[key] }));
    }

    return cleanError;
  }

  protected isUnauthorizedError(error: GraphQLError): boolean {
    return (
      error.message === 'Unauthorized' ||
      error.extensions?.code === 'FORBIDDEN' ||
      error.extensions?.exception?.status === 401
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  protected onUnauthorizedError(error: UnauthorizedError): void {
    // extending classes can take action here, e.g. go to log in page
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  protected onServerError(error: ServerError): void {
    // extending classes can take action here, e.g. capture to Sentry
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  protected onInputValidationError(error: InputValidationError): void {
    // extending classes can take action here, e.g. capture to Sentry
  }

  protected getFriendlyMessage(errorCode: string, errorMessage: string): string;
  protected getFriendlyMessage(errorCode: string): string | undefined;
  protected getFriendlyMessage(errorCode: string, errorMessage?: string): string | undefined {
    return (this.constructor as typeof ApolloErrorProcessor).FriendlyMessages[errorCode] ?? errorMessage;
  }

  protected processErrorMessage(message: GraphQLError['message']): string {
    if (typeof message === 'object') {
      if (message.error != null) {
        return message.error;
      }

      return 'Unknown error: ' + JSON.stringify(message);
    }

    return message;
  }

  protected normalizeError(error: GraphQLError | Error): Error {
    if (isGraphQLError(error)) {
      return {
        ...error,
        message: this.processErrorMessage(error.message),
      };
    }

    return error;
  }

  private processApolloError(error: ApolloError): ProcessedApolloError[] {
    if (error.graphQLErrors != null && error.graphQLErrors.length > 0) {
      // Successful request but with errors from the resolver
      return error.graphQLErrors.flatMap(graphQLError => this.processGraphQLError(graphQLError));
    }

    if (
      error.networkError != null &&
      error.networkError.result != null &&
      error.networkError.result.errors != null &&
      error.networkError.result.errors.length > 0
    ) {
      // Network error that contains GraphQL errors inside it. Can occur when server responds with a non-200 status code
      return error.networkError.result.errors.flatMap(graphQLError => this.processGraphQLError(graphQLError));
    }

    if (error.networkError != null) {
      // Network error, e.g. server is not responding or some other exception occurs
      return this.processNetworkError(error);
    }

    // Some other internal server error
    const processedError: ServerError = {
      type: ApolloErrorType.SERVER_ERROR,
      error,
      message: error.message,
    };

    this.onServerError(processedError);

    return [processedError];
  }

  private processGraphQLError(error: GraphQLError): ProcessedApolloError[] {
    if (this.isUnauthorizedError(error)) {
      // Unauthorized (not logged in, or not allowed) error
      const processedError: UnauthorizedError = {
        type: ApolloErrorType.UNAUTHORIZED_ERROR,
        error: this.normalizeError(error),
        message: this.processErrorMessage(error.message),
        path: error.path,
      };

      this.onUnauthorizedError(processedError);

      return [processedError];
    }

    if (error.extensions?.validationErrors != null) {
      // User input validation error
      const processedError: InputValidationError = {
        type: ApolloErrorType.INPUT_VALIDATION_ERROR,
        error: this.normalizeError(error),
        message: this.processErrorMessage(error.message),
        path: error.path,
        invalidArgs: error.extensions.invalidArgs,
        violations: error.extensions.validationErrors,
      };

      this.onInputValidationError(processedError);

      return [processedError];
    }

    // Other GraphQL resolver error - probably a bug
    const processedError: ServerError = {
      type: error.extensions?.code != null ? error.extensions.code : ApolloErrorType.SERVER_ERROR,
      error: this.normalizeError(error),
      message: this.getFriendlyMessage('INTERNAL_SERVER_ERROR', this.processErrorMessage(error.message)),
      path: error.path,
    };

    this.onServerError(processedError);

    return [processedError];
  }

  private processNetworkError(error: ApolloError): ProcessedApolloError[] {
    const errors: ProcessedApolloError[] = [];
    let message: string;

    if (error.networkError != null && error.networkError.message != null) {
      message = this.processErrorMessage(error.networkError.message);
    } else {
      message = this.processErrorMessage(error.message);
    }

    switch (message) {
      case 'Failed to fetch':
        message = this.getFriendlyMessage('FAILED_TO_FETCH', message);
        break;
    }

    errors.push({
      type: ApolloErrorType.NETWORK_ERROR,
      error,
      statusCode: error.networkError != null ? error.networkError.statusCode : undefined,
      message,
    });

    return errors;
  }
}
