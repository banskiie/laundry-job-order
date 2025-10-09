import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge"

// Schemas
import sharedSchema from "./schemas/shared.schema"
import userSchema from "./schemas/user.schema"
import authSchema from "./schemas/auth.schema"

// Resolvers
import userResolvers from "./resolvers/user.resolver"
import authResolvers from "./resolvers/auth.resolver"
import orderSchema from "./schemas/order.schema"
import orderResolvers from "./resolvers/order.resolver"

export const typeDefs = mergeTypeDefs([
  sharedSchema,
  userSchema,
  authSchema,
  orderSchema,
])
export const resolvers = mergeResolvers([
  userResolvers,
  authResolvers,
  orderResolvers,
])
