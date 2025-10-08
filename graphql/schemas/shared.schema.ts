import { gql } from "graphql-tag"

export default gql`
  scalar JSON
  scalar DateTime

  type Response {
    ok: Boolean!
    message: String
  }

  type Option {
    label: String!
    value: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  # Table Filtering
  enum FilterType {
    TEXT
    NUMBER
    NUMBER_RANGE
    DATE
    DATE_RANGE
    BOOLEAN
  }

  input Filter {
    key: String!
    value: String!
    type: FilterType!
  }

  # Table Sorting
  enum SortOrder {
    ASC
    DESC
  }

  input Sort {
    key: String!
    order: SortOrder!
  }
`
