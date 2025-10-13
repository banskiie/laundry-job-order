import { gql } from "graphql-tag"

export default gql`
  enum PaymentMethod {
    CASH
    CREDIT_CARD
    DEBIT_CARD
    GCASH
    BANK_TRANSFER
    SALARY_DEDUCTION
  }

  type Payment {
    _id: ID!
    order: Order!
    proofOfPaymentURL: String
    paymentMethod: PaymentMethod!
    amountPaid: Float!
    datePaid: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PaymentConnection {
    total: Int!
    pages: Int!
    edges: [PaymentEdge!]!
    pageInfo: PageInfo!
  }

  type PaymentNode {
    _id: ID!
    customerName: String
    amountPaid: Float!
    datePaid: DateTime!
    paymentMethod: PaymentMethod!
  }

  type PaymentEdge {
    node: PaymentNode!
    cursor: String!
  }

  input UploadPaymentInput {
    order: ID!
    proofOfPaymentURL: String
    paymentMethod: PaymentMethod!
    amountPaid: Float!
    datePaid: DateTime!
    isFullyPaid: Boolean
  }

  input UpdatePaymentInput {
    _id: ID!
    order: ID
    proofOfPaymentURL: String
    paymentMethod: PaymentMethod
    amountPaid: Float
    datePaid: DateTime
    isFullyPaid: Boolean
  }

  type Query {
    payment(_id: ID!): Payment!
    payments(
      first: Int
      after: String
      search: String
      filter: [Filter]
      sort: Sort
    ): PaymentConnection!
  }

  type Mutation {
    uploadPayment(input: UploadPaymentInput!): Response!
    updatePayment(input: UpdatePaymentInput!): Response!
    deletePayment(_id: ID!): Response!
  }
`
