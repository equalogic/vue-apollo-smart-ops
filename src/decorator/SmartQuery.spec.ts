import { ApolloQueryResult } from 'apollo-client';
import gql from 'graphql-tag';
import { Component, Vue } from 'vue-property-decorator';
import { createSmartQueryOptionsFunction } from '../query';
import { SmartQuery } from './SmartQuery';

interface Todo {
  id: string;
  title: string;
}

interface QueryResult {
  todos: Todo[];
  __typename?: 'Query';
}

interface QueryVariables {
  skip?: number;
  limit?: number;
}

describe('@SmartQuery() decorator', () => {
  it('Adds basic query options', () => {
    @Component
    class TodoList extends Vue {
      @SmartQuery({
        query: gql`
          query Todos($skip: Int, $limit: Int) {
            todos(skip: $skip, limit: $limit) {
              id
              title
            }
          }
        `,
        variables() {
          return this.vars;
        },
      })
      todos!: Todo[];

      get vars(): QueryVariables {
        return {
          limit: 10,
          skip: 0,
        };
      }
    }

    const instance = new TodoList();

    expect(instance.$options.apollo?.todos).toEqual(
      expect.objectContaining({
        query: expect.objectContaining({ definitions: expect.arrayContaining([]) }),
        variables: expect.any(Function),
      }),
    );
  });

  it('Works with a query options function', () => {
    const useTodoListQuery = createSmartQueryOptionsFunction<QueryResult, QueryVariables>(gql`
      query Todos($skip: Int, $limit: Int) {
        todos(skip: $skip, limit: $limit) {
          id
          title
        }
      }
    `);

    @Component<TodoList>({})
    class TodoList extends Vue {
      @SmartQuery(
        useTodoListQuery<TodoList>({
          skip() {
            return this.foo === 'bar';
          },
          variables() {
            return this.vars;
          },
          loadingKey: 'loading',
        }),
      )
      todos!: Todo[];

      loading: number = 0;

      get vars(): QueryVariables {
        return {
          limit: 10,
          skip: 0,
        };
      }

      get foo(): string {
        return 'bar';
      }
    }

    const instance = new TodoList();

    expect(instance.$options.apollo?.todos).toEqual(
      expect.objectContaining({
        query: expect.objectContaining({ definitions: expect.arrayContaining([]) }),
        skip: expect.any(Function),
        variables: expect.any(Function),
      }),
    );
  });

  it('Works with class inheritance and update, result methods', () => {
    @Component
    class TodoList extends Vue {
      @SmartQuery({
        query: gql`
          query Todos($skip: Int, $limit: Int) {
            todos(skip: $skip, limit: $limit) {
              id
              title
            }
          }
        `,
        variables() {
          return this.vars;
        },
      })
      todos!: Todo[];

      get vars(): QueryVariables {
        return {
          limit: 10,
          skip: 0,
        };
      }
    }

    @Component
    class TodoList2 extends TodoList {
      @SmartQuery<TodoList2, QueryResult>({
        query: gql`
          query Todos($skip: Int, $limit: Int) {
            todos(skip: $skip, limit: $limit) {
              id
              title
            }
          }
        `,
        variables() {
          return this.vars;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        update(data: QueryResult) {
          // data: QueryResult
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        result({ data, errors, loading }) {
          this.doThings();
        },
        subscribeToMore: {
          document: gql`
            query Todos($skip: Int, $limit: Int) {
              todos(skip: $skip, limit: $limit) {
                id
                title
              }
            }
          `,
          variables() {
            return this.vars;
          },
        },
      })
      todos!: Todo[];

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      doThings() {
        //
      }
    }

    const instance = new TodoList2();

    expect(instance.$options.apollo?.todos).toEqual(
      expect.objectContaining({
        query: expect.objectContaining({ definitions: expect.arrayContaining([]) }),
        variables: expect.any(Function),
        update: expect.any(Function),
        result: expect.any(Function),
      }),
    );
  });

  it('Supports subscribeToMore with updateQuery method', () => {
    @Component
    class TodoList extends Vue {
      @SmartQuery({
        query: gql`
          query Todos($skip: Int, $limit: Int) {
            todos(skip: $skip, limit: $limit) {
              id
              title
            }
          }
        `,
        variables() {
          return this.vars;
        },
      })
      todos!: Todo[];

      get vars(): QueryVariables {
        return {
          limit: 10,
          skip: 0,
        };
      }
    }

    @Component
    class TodoList3 extends TodoList {
      @SmartQuery<TodoList3, QueryResult, QueryVariables>({
        query: gql`
          query Todos($skip: Int, $limit: Int) {
            todos(skip: $skip, limit: $limit) {
              id
              title
            }
          }
        `,
        variables() {
          return this.vars;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        update(data: QueryResult) {
          // data: QueryResult
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
        result(data: ApolloQueryResult<QueryResult>) {},
        subscribeToMore: [
          {
            document: gql`
              query Todos($skip: Int, $limit: Int) {
                todos(skip: $skip, limit: $limit) {
                  id
                  title
                }
              }
            `,
            variables() {
              return this.vars;
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            updateQuery(prev, { subscriptionData: { data }, variables }) {
              return {
                ...prev,
                todos: [
                  { id: '1', title: 'Int' },
                  { id: '2', title: 'Float' },
                  { id: '3', title: 'String' },
                ],
              };
            },
          },
        ],
      })
      todos!: Todo[];
    }

    const instance = new TodoList3();

    expect(instance.$options.apollo?.todos).toEqual(
      expect.objectContaining({
        query: expect.objectContaining({ definitions: expect.arrayContaining([]) }),
        variables: expect.any(Function),
        update: expect.any(Function),
        result: expect.any(Function),
        subscribeToMore: expect.arrayContaining([
          expect.objectContaining({
            document: expect.objectContaining({ definitions: expect.arrayContaining([]) }),
            variables: expect.any(Function),
            updateQuery: expect.any(Function),
          }),
        ]),
      }),
    );
  });
});
