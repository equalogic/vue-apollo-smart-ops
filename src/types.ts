import { VueApolloSubscribeToMoreOptions } from 'vue-apollo/types/options';

type OverrideThis<F, T> = F extends (...args: infer A) => infer B ? (this: T, ...args: A) => B : F;

export type OverrideAllThis<O, T> = {
  [key in keyof O]: OverrideThis<O[key], T>;
};

export type SubscribeToMoreOptionsPatched<TComponent, TResult, TVariables> = OverrideAllThis<
  Omit<VueApolloSubscribeToMoreOptions<TResult, TVariables>, 'updateQuery' | 'variables'>,
  TComponent
> & {
  variables?: (this: TComponent) => any;
  updateQuery?: UpdateQueryFn<TComponent, TResult, any, any>; // TODO: How should we pass subscript data & variables types?
};

type UpdateQueryFn<TComponent = any, TResult = any, TSubscriptionVariables = any, TSubscriptionData = any> = (
  this: TComponent,
  previousQueryResult: TResult,
  options: {
    subscriptionData: {
      data: TSubscriptionData;
    };
    variables?: TSubscriptionVariables;
  },
) => TResult;

export type ApolloOperationContext<TAttrs = Record<string, any>> = TAttrs;
