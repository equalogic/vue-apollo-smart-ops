# vue-apollo-smart-ops

Creates TypeScript-typed operation functions for GraphQL queries and mutations compatible with
[Vue Apollo](https://apollo.vuejs.org/).

This library is intended to be used together with the
[`typescript-vue-apollo-smart-ops` plugin](https://www.graphql-code-generator.com/docs/plugins/typescript-vue-apollo-smart-ops)
for [GraphQL Code Generator](https://www.graphql-code-generator.com/), but it may also be useful standalone.

## Installation

```shell
npm install --save vue-apollo-smart-ops
```

## Smart Query Usage

### `createSmartQueryOptionsFunction<TResult, TVariables>(query: DocumentNode, onError?: ApolloOperationErrorHandlerFunction): VueApolloSmartQueryOptionsFunction`

Returns a generated function which returns a [Vue Apollo Smart Query options object](https://apollo.vuejs.org/api/smart-query.html#options)
for the given query when called.

> ⚠️ Note: The returned function is not meant to execute the query itself. It is only used to configure a Vue Apollo
> Smart Query. The responsibility for executing the query lies with Vue Apollo.

The returned function accepts an options object as its first argument, allowing variables and other parameters to be
customised in runtime usage. Compared with creating an options object directly, the advantage here is that the options
accepted by the generated function are fully type-checked based on the query definition - and without needing to pass
type arguments at every usage.

Using the [`@graphql-codegen/typescript-vue-apollo-smart-ops` plugin](https://www.graphql-code-generator.com/docs/plugins/typescript-vue-apollo-smart-ops)
you can automatically generate options functions for all of the query operations in your project.

The following example manually creates an options function and assigns it to the variable `useTodoListQuery`:

```typescript
const useTodoListQuery = createSmartQueryOptionsFunction<TodosQuery, TodosQueryVariables>(gql`
  query Todos($skip: Int, $limit: Int) {
    todos(skip: $skip, limit: $limit) {
      id
      title
    }
  }
`);
```

This function can subsequently be called inside the `apollo` options of a Vue component to configure a Smart Query. The
following example adds a `todos` Smart Query to a component, in Vue class component style:

```typescript
@Component<TodoList>({
  apollo: {
    todos: useTodoListQuery<TodoList>({
      skip() {
        return this.foo === 'bar';
      },
      variables() {
        return {
          limit: 10,
          skip: 0,
        };
      },
    })
  }
})
class TodoList extends Vue {
  todos: Todo[] | null = null;

  get foo(): string {
    return 'bar';
  }
}
```

### `@SmartQuery(options: VueApolloSmartQueryOptions)`

The `@SmartQuery()` decorator works with your generated options functions to enable the declaration of Smart Queries
within the body of a Vue class component, instead of in the component options. This helps to keep the data property and
its query options together in one place.

The following example is equivalent to the previous example but using the decorated syntax style:

```typescript
@Component
class TodoList extends Vue {
  @SmartQuery(
    useTodoListQuery<TodoList>({
      skip() {
        return this.foo === 'bar';
      },
      variables() {
        return this.vars;
      },
    }),
  )
  todos: Todo[] | null = null;

  get foo(): string {
    return 'bar';
  }
}
```

## Mutations Usage

### `createMutationFunction(mutation: DocumentNode, onError?: ): MutationOperationFunction`

Returns a generated function which executes a mutation and returns the result when called.

The returned function requires a Vue app instance as its first argument (from which the `$apollo` client will be
accessed), and accepts an options object as its second argument, allowing variables and other parameters to be
customised in runtime usage. Compared with executing a mutation using the Vue Apollo client directly, the advantage here
is that the options accepted by the generated function are fully type-checked based on the operation definition - and
without needing to pass type arguments at every usage.

Using the [`@graphql-codegen/typescript-vue-apollo-smart-ops` plugin](https://www.graphql-code-generator.com/docs/plugins/typescript-vue-apollo-smart-ops)
you can automatically generate mutation functions for all of the mutation operations in your project.

The following example manually creates a mutation function and assigns it to the variable `todoCreateMutation`:

```typescript
const todoCreateMutation = createMutationFunction<TodoCreateMutation, TodoCreateMutationVariables>(gql`
  mutation TodoCreate($input: TodoInput!) {
    todoCreate(input: $input) {
      todo {
        id
        title
      }
    }
  }
`);
```

The following example demonstrates how to call this mutation from a method on a component:

```typescript
@Component
class TodoList extends Vue {
  async onClickCreateTodoButton(): Promise<void> {
    const result = await todoCreateMutation(this, {
      variables: {
        title: 'Bake a cake',
      },
    });
    
    if (!result.success) {
      throw new Error(`Failed to create Todo!`);
    }
  }
}
```
