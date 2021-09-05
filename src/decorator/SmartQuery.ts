/*
 * Based on https://github.com/chanlito/vue-apollo-decorator by chanlito ❤️
 */

import { ApolloError, OperationVariables } from 'apollo-client';
import { DocumentNode } from 'graphql';
import Vue from 'vue';
import { createDecorator, VueDecorator } from 'vue-class-component';
import { VueApolloSmartQueryOptions } from '../query';

export function SmartQuery<TApp = any, TResult = any, TVariables = OperationVariables, TError = ApolloError>(
  options: TApp extends Vue ? VueApolloSmartQueryOptions<TResult, TVariables, TError, TApp> : DocumentNode,
): VueDecorator {
  return createDecorator((componentOptions: any, k: string) => {
    componentOptions.apollo = componentOptions.apollo || {};
    componentOptions.apollo[k] = options;
  });
}
