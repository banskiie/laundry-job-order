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

  enum POSStatus {
    UNADDED
    ADDED
    VERIFIED
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
    amountPaid: Float
  }

  type Comment {
    message: String!
    by: User!
    date: DateTime!
  }

  type Order {
    _id: ID!
    orderNumber: String!
    customerName: String!
    orderSlipURL: String!
    amountToBePaid: Float!
    amountMissing: Float
    orderStatuses: [OrderStatusItem!]!
    paymentStatuses: [PaymentStatusItem!]!
    addedToPOS: POSStatus
    createdAt: DateTime!
    updatedAt: DateTime!
    comments: [Comment]
  }

  type OrderConnection {
    total: Int!
    pages: Int!
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
  }

  type OrderNode {
    _id: ID!
    orderNumber: String!
    customerName: String!
    amountToBePaid: Float!
    dateReceived: DateTime!
    currentStatus: OrderStatus!
    paymentStatus: PaymentStatus!
    addedToPOS: POSStatus
  }

  type OrderEdge {
    node: OrderNode!
    cursor: String!
  }

  input CreateOrderInput {
    orderNumber: String!
    customerName: String!
    amountToBePaid: Float!
    orderSlipURL: String!
    dateReceived: DateTime!
  }

  input UpdateOrderInput {
    _id: ID!
    orderNumber: String
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
    changeAddedToPOSStatus(_id: ID!, status: POSStatus!): Response!
    insertComment(orderId: ID!, message: String!): Response!
    revertCancel(_id: ID!): Response!
  }
`
