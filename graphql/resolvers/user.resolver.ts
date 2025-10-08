import { endOfDay, startOfDay } from "date-fns"
import { GraphQLError } from "graphql"
import { Types, type PipelineStage } from "mongoose"
import { fromCursor, toCursor } from "@/helpers/cursor"
import User from "@/models/user.model"
import type { IDataTableInput } from "@/types/shared.interface"
import { type IUserInput } from "@/types/user.interface"

const userResolvers = {
  Query: {
    user: async (_: any, args: { _id: string }) => {
      try {
        const user = await User.findById(args._id)

        if (!user)
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return user
      } catch (error) {
        throw error
      }
    },
    users: async (
      _: any,
      { first, after, search, filter, sort }: IDataTableInput
    ) => {
      try {
        const matchStage: Record<string, any> = {}

        // Handle global search
        if (search)
          matchStage.$or = [
            { name: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } },
          ]

        // Handle filters
        if (filter && filter.length)
          matchStage.$and = filter.map(({ key, value, type }) => {
            switch (type) {
              case "TEXT":
                return { [key]: { $regex: value, $options: "i" } }
              case "NUMBER":
                return { [key]: Number(value) }
              case "NUMBER_RANGE":
                const [min, max] = value.split(",").map(Number)
                return { [key]: { $gte: min, $lte: max } }
              case "DATE":
                const date = new Date(value)
                const startDate = startOfDay(date)
                const endDate = endOfDay(date)
                return { [key]: { $gte: startDate, $lte: endDate } }
              case "DATE_RANGE":
                const [start, end] = value
                  .split(",")
                  .map((date) => new Date(date))
                if (!start || !end) return
                return {
                  [key]: {
                    $gte: startOfDay(start),
                    $lte: endOfDay(end),
                  },
                }
              case "BOOLEAN":
                return { [key]: value === "true" }
              default:
                return
            }
          })

        // Handle Cursor Pagination (using _id as cursor)
        if (after) {
          // Decode the cursor
          const { type, id } = fromCursor(after)
          if (type !== "user") throw new Error("Invalid cursor")
          matchStage._id = {
            // If sort is provided, use it to determine the direction of pagination
            ...(sort && sort?.order === "ASC"
              ? { $gt: new Types.ObjectId(id) }
              : { $lt: new Types.ObjectId(id) }),
          }
        }

        // Aggregation Pipeline
        const pipeline: PipelineStage[] = [
          { $match: matchStage },
          {
            $sort: {
              ...(sort
                ? { [sort.key]: sort.order === "ASC" ? 1 : -1 }
                : { _id: -1 }), // Default to sorting by latest _id if no sort is provided
            },
          },
          { $limit: first + 1 },
          {
            $project: {
              name: 1,
              username: 1,
              role: 1,
              isActive: 1,
            },
          },
        ]

        // Fetch from DB
        const data = await User.aggregate(pipeline)

        const edges = data.slice(0, first).map((edge) => ({
          node: edge,
          // Encode the cursor
          cursor: toCursor("user", edge._id.toString()),
        }))

        // Get total count (remove id and count all documents that match other criteria)
        const total = await User.aggregate([
          {
            $match: (() => {
              const { _id, ...rest } = matchStage
              return rest
            })(),
          },
          { $count: "total" },
        ]).then((res) => (res[0] ? res[0].total : 0))

        return {
          total,
          pages: Math.ceil(total / first),
          edges,
          pageInfo: {
            endCursor: edges.length
              ? edges[edges.length - 1]?.cursor ?? null
              : null,
            hasNextPage: data.length > first,
          },
        }
      } catch (error) {
        throw error
      }
    },
  },
  Mutation: {
    createUser: async (_: any, args: { input: IUserInput }) => {
      try {
        await User.create(args.input)
        return {
          ok: true,
          message: "User created successfully",
        }
      } catch (error) {
        throw error
      }
    },
    updateUser: async (_: any, args: { input: IUserInput }) => {
      try {
        const user = await User.findByIdAndUpdate(args.input._id, args.input, {
          new: true,
        })
        if (!user)
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return {
          ok: true,
          message: "User updated successfully",
        }
      } catch (error) {
        throw error
      }
    },
    deleteUser: async (_: any, args: { _id: string }) => {
      try {
        const user = await User.findByIdAndDelete(args._id)
        if (!user)
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return {
          ok: true,
          message: "User deleted successfully",
        }
      } catch (error) {
        throw error
      }
    },
  },
}

export default userResolvers
