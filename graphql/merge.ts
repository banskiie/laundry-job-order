import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge"

// Schemas
import sharedSchema from "./schemas/shared.schema"
import userSchema from "./schemas/user.schema"
import authSchema from "./schemas/auth.schema"
import orderSchema from "./schemas/order.schema"
import paymentSchema from "./schemas/payment.schema"

// Resolvers
import userResolvers from "./resolvers/user.resolver"
import authResolvers from "./resolvers/auth.resolver"
import orderResolvers from "./resolvers/order.resolver"
import paymentResolvers from "./resolvers/payment.resolver"

export const typeDefs = mergeTypeDefs([
  sharedSchema,
  userSchema,
  authSchema,
  orderSchema,
  paymentSchema,
])

export const resolvers = mergeResolvers([
  userResolvers,
  authResolvers,
  orderResolvers,
  paymentResolvers,
])
