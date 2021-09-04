import { ApolloQueryResult } from 'apollo-client';
import gql from 'graphql-tag';
import { VueApolloQueryDefinition } from 'vue-apollo/types/options';
import { Component, Vue } from 'vue-property-decorator';
import { createSmartQueryOptionsFunction } from '../src';
import { SmartQuery } from '../src/decorator';

// Create a query options function
const useTodoListQuery = createSmartQueryOptionsFunction<QueryResult, QueryVariables>(gql`
  query Todos($skip: Int, $limit: Int) {
    todos(skip: $skip, limit: $limit) {
      id
      title
    }
  }
`);

// Ensure that the result of the options function can be assigned to a regular VueApolloQueryDefinition
const options: VueApolloQueryDefinition<QueryResult, QueryVariables> = useTodoListQuery({
  variables: {
    limit: 10,
    skip: 0,
  }
});

@Component
export class TodoList1 extends Vue {
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

@Component<TodoList2>({})
export class TodoList2 extends Vue {
  @SmartQuery(useTodoListQuery<TodoList2>({
    skip() {
      return this.foo === 'bar';
    },
    variables() {
      return this.vars;
    },
  }))
  todos!: Todo[];

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

@Component
export class TodoList3 extends TodoList1 {
  @SmartQuery<TodoList3>({
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
}

@Component
export class TodoList4 extends TodoList1 {
  @SmartQuery<TodoList4, QueryResult>({
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
    update(data: QueryResult) {
      // data: QueryResult
    },
    result({ data, errors, loading }) {
      this.doThings();
    },
    subscribeToMore: {
      document: gql``,
      variables() {
        return this.vars;
      },
    },
  })
  todos!: Todo[];

  doThings() {
    //
  }
}

@Component
export class TodoList5 extends TodoList1 {
  @SmartQuery<TodoList5, QueryResult, QueryVariables>({
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
    update(data: QueryResult) {
      // data: QueryResult
    },
    result(data: ApolloQueryResult<QueryResult>) {},
    subscribeToMore: [
      {
        document: gql``,
        variables() {
          return this.vars;
        },
        updateQuery(prev, { subscriptionData: { data }, variables }) {
          const vm: TodoList5 = this;
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
