import { gql } from "graphql-tag"

export default gql`
  enum Role {
    ADMIN
    STAFF
    CASHIER
  }

  type User {
    _id: ID!
    name: String!
    username: String!
    role: Role!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserConnection {
    total: Int!
    pages: Int!
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }

  type UserNode {
    _id: ID!
    name: String!
    username: String!
    role: Role!
    isActive: Boolean!
  }

  type UserEdge {
    node: UserNode!
    cursor: String!
  }

  input CreateUserInput {
    name: String!
    username: String!
    role: Role!
  }

  input UpdateUserInput {
    _id: ID!
    name: String
    username: String
    role: Role
  }

  type Query {
    user(_id: ID!): User!
    users(
      first: Int
      after: String
      search: String
      filter: [Filter]
      sort: Sort
    ): UserConnection!
  }

  type Mutation {
    createUser(input: CreateUserInput!): Response!
    updateUser(input: UpdateUserInput!): Response!
    deleteUser(_id: ID!): Response!
  }
`
