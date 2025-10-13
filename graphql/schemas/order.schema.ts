import { gql } from "graphql-tag"

export default gql`
  enum OrderStatus {
    RECEIVED
    READY_TO_PAY
    RELEASED
    VERIFIED
    CANCELLED
  }

  enum PaymentStatus {
    UNPAID
    PARTIALLY_PAID
    PAID
  }

  type OrderStatusItem {
    status: OrderStatus!
    date: DateTime!
    by: User!
  }

  type PaymentStatusItem {
    status: PaymentStatus!
    date: DateTime!
    by: User!
  }

  type Order {
    _id: ID!
    customerName: String!
    orderSlipURL: String!
    amountToBePaid: Float!
    orderStatuses: [OrderStatusItem!]!
    paymentStatuses: [PaymentStatusItem!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderConnection {
    total: Int!
    pages: Int!
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
  }

  type OrderNode {
    _id: ID!
    customerName: String!
    amountToBePaid: Float!
    dateReceived: DateTime!
    currentStatus: OrderStatus!
    paymentStatus: PaymentStatus!
  }

  type OrderEdge {
    node: OrderNode!
    cursor: String!
  }

  input CreateOrderInput {
    customerName: String!
    amountToBePaid: Float!
    orderSlipURL: String!
    dateReceived: DateTime!
  }

  input UpdateOrderInput {
    _id: ID!
    customerName: String
    amountToBePaid: Float
    orderSlipURL: String!
  }

  type Query {
    order(_id: ID!): Order!
    orders(
      first: Int
      after: String
      search: String
      filter: [Filter]
      sort: Sort
    ): OrderConnection!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Response!
    updateOrder(input: UpdateOrderInput!): Response!
    deleteOrder(_id: ID!): Response!
    changeOrderStatus(_id: ID!, status: OrderStatus!): Response!
  }
`
