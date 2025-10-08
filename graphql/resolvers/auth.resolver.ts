import { GraphQLError } from "graphql"
import User from "@/models/user.model"
import bcrypt from "bcryptjs"

const authResolvers = {
  Mutation: {
    signIn: async (_: any, args: { username: string; password: string }) => {
      try {
        const user = await User.findOne({ username: args.username })
        if (!user)
          throw new GraphQLError("Invalid username or password", {
            extensions: { code: "UNAUTHORIZED" },
          })
        const isMatch = await bcrypt.compare(args.password, user.password!)
        if (!isMatch)
          throw new GraphQLError("Invalid username or password", {
            extensions: { code: "UNAUTHORIZED" },
          })
        return user
      } catch (error) {
        throw error
      }
    },
    changePassword: async (
      _: any,
      args: { _id: string; newPassword: string }
    ) => {
      try {
        const user = await User.findByIdAndUpdate(
          args._id,
          { password: await bcrypt.hash(args.newPassword, 10) },
          { new: true }
        )
        if (!user)
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return true
      } catch (error) {
        throw error
      }
    },
  },
}

export default authResolvers
