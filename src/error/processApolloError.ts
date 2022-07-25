import type { App as Vue } from '@vue/runtime-core';
import { ApolloOperationContext } from '../types';
import {
  ApolloError,
  ApolloErrorType,
  GraphQLError,
  InputValidationError,
  NetworkError,
  ProcessedApolloError,
  ServerError,
  StatusException,
  UnauthorizedError,
  ValidationRuleViolation,
} from './types';

export function isApolloError(error: ApolloError | any): error is ApolloError {
  return error.graphQLErrors !== undefined;
}

export function isGraphQLError(error: GraphQLError | any): error is GraphQLError {
  return error.extensions !== undefined;
}

function normalizeErrorMessage(message: GraphQLError['message']): string {
  if (typeof message === 'object') {
    if (message.error != null) {
      return message.error;
    }

    return 'Unknown error: ' + JSON.stringify(message);
  }

  return message;
}

function normalizeError(error: GraphQLError | Error): Error {
  if (isGraphQLError(error)) {
    return {
      ...error,
      message: normalizeErrorMessage(error.message),
    };
  }

  return error;
}

function translateErrorMessage(messageOrCode: string, translations: Record<string, string>): string {
  return translations[messageOrCode] ?? messageOrCode;
}

export interface ApolloErrorProcessorOptions<TApp = Vue, TContext = ApolloOperationContext> {
  app?: TApp;
  context?: TContext;
  isUnauthorizedError?: (error: GraphQLError) => boolean;
  onUnauthorizedError?: (error: UnauthorizedError) => boolean | void;
  onInputValidationError?: (error: InputValidationError) => boolean | void;
  onServerError?: (error: ServerError) => boolean | void;
  onNetworkError?: (error: NetworkError) => boolean | void;
  translations?: Record<string, string>;
}

export const defaultErrorMessageTranslations: Record<string, string> = {
  FAILED_TO_FETCH:
    'Unable to communicate with server. The service may be down or you may be offline. Try again in a moment.',
  INTERNAL_SERVER_ERROR: `A server error has occurred.`,
};

const defaultProcessorOptions: ApolloErrorProcessorOptions = {
  isUnauthorizedError: (error: GraphQLError) =>
    error.message === 'Unauthorized' ||
    error.extensions?.code === 'FORBIDDEN' ||
    (error.extensions?.exception as StatusException)?.status === 401,
  translations: defaultErrorMessageTranslations,
};

export interface ApolloErrorProcessorResult {
  unhandledErrors: ProcessedApolloError[];
  handledErrors: ProcessedApolloError[];
}

function processGraphQLError(
  error: GraphQLError,
  options: ApolloErrorProcessorOptions = {},
): ApolloErrorProcessorResult {
  options = { ...defaultProcessorOptions, ...options };
  const { isUnauthorizedError, onUnauthorizedError, onInputValidationError, onServerError, translations } = options;

  if (isUnauthorizedError != null && isUnauthorizedError(error)) {
    // Unauthorized (not logged in, or not allowed) error
    const processedError: UnauthorizedError = {
      type: ApolloErrorType.UNAUTHORIZED_ERROR,
      error: normalizeError(error),
      message: normalizeErrorMessage(error.message),
      path: error.path,
    };

    if (onUnauthorizedError != null && onUnauthorizedError(processedError)) {
      return { unhandledErrors: [], handledErrors: [processedError] };
    }

    return { unhandledErrors: [processedError], handledErrors: [] };
  }

  if (error.extensions?.validationErrors != null) {
    // User input validation error
    const processedError: InputValidationError = {
      type: ApolloErrorType.INPUT_VALIDATION_ERROR,
      error: normalizeError(error),
      message: normalizeErrorMessage(error.message),
      path: error.path,
      invalidArgs: error.extensions.invalidArgs as string[],
      violations: error.extensions.validationErrors as ValidationRuleViolation[],
    };

    if (onInputValidationError != null && onInputValidationError(processedError)) {
      return { unhandledErrors: [], handledErrors: [processedError] };
    }

    return { unhandledErrors: [processedError], handledErrors: [] };
  }

  // Other GraphQL resolver error - probably a bug
  const processedError: ServerError = {
    type: (error.extensions?.code != null
      ? error.extensions.code
      : ApolloErrorType.SERVER_ERROR) as ApolloErrorType.SERVER_ERROR,
    error: normalizeError(error),
    message: translateErrorMessage('INTERNAL_SERVER_ERROR', translations ?? defaultErrorMessageTranslations),
    path: error.path,
  };

  if (onServerError != null && onServerError(processedError)) {
    return { unhandledErrors: [], handledErrors: [processedError] };
  }

  return { unhandledErrors: [processedError], handledErrors: [] };
}

function processNetworkError(
  error: ApolloError,
  options: ApolloErrorProcessorOptions = {},
): ApolloErrorProcessorResult {
  options = { ...defaultProcessorOptions, ...options };
  const { onNetworkError, translations } = options;

  let message: string =
    error.networkError != null && error.networkError.message != null
      ? normalizeErrorMessage(error.networkError.message)
      : normalizeErrorMessage(error.message);

  switch (message) {
    case 'Failed to fetch':
      message = translateErrorMessage('FAILED_TO_FETCH', translations ?? defaultErrorMessageTranslations);
      break;
  }

  const processedError: NetworkError = {
    type: ApolloErrorType.NETWORK_ERROR,
    error,
    statusCode: error.networkError != null ? error.networkError.statusCode : undefined,
    message,
  };

  if (onNetworkError != null && onNetworkError(processedError)) {
    return { unhandledErrors: [], handledErrors: [processedError] };
  }

  return { unhandledErrors: [processedError], handledErrors: [processedError] };
}

export function processApolloError(
  error: ApolloError,
  options: ApolloErrorProcessorOptions = {},
): ApolloErrorProcessorResult {
  options = { ...defaultProcessorOptions, ...options };
  const { onServerError } = options;

  if (error.graphQLErrors != null && error.graphQLErrors.length > 0) {
    // Successful request but with errors from the resolver
    const errorProcessorResults = error.graphQLErrors.map(graphQLError => processGraphQLError(graphQLError, options));

    return {
      unhandledErrors: errorProcessorResults.flatMap(result => result.unhandledErrors),
      handledErrors: errorProcessorResults.flatMap(result => result.handledErrors),
    };
  }

  if (error.networkError?.result?.errors != null && error.networkError.result.errors.length > 0) {
    // Network error that contains GraphQL errors inside it. Can occur when server responds with a non-200 status code
    const errorProcessorResults = error.networkError.result.errors.map(graphQLError =>
      processGraphQLError(graphQLError, options),
    );

    return {
      unhandledErrors: errorProcessorResults.flatMap(result => result.unhandledErrors),
      handledErrors: errorProcessorResults.flatMap(result => result.handledErrors),
    };
  }

  if (error.networkError != null) {
    // Network error, e.g. server is not responding or some other exception occurs
    return processNetworkError(error, options);
  }

  // Some other internal server error
  const processedError: ServerError = {
    type: ApolloErrorType.SERVER_ERROR,
    error,
    message: error.message,
  };

  if (onServerError != null && onServerError(processedError)) {
    return { unhandledErrors: [], handledErrors: [processedError] };
  }

  return { unhandledErrors: [processedError], handledErrors: [] };
}
