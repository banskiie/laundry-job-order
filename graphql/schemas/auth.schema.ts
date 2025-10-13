import { gql } from "graphql-tag"

export default gql`
  type Mutation {
    signIn(username: String!, password: String!): User!
    changePassword(_id: ID!, newPassword: String!): Response!
    resetPassword(_id: ID!): Response!
  }
`
