import { endOfDay, startOfDay } from "date-fns"
import { GraphQLError } from "graphql"
import { Types, type PipelineStage } from "mongoose"
import { fromCursor, toCursor } from "@/helpers/cursor"
import Order from "@/models/order.model"
import type { IDataTableInput } from "@/types/shared.interface"
import { OrderStatus, type IOrderInput } from "@/types/order.interface"
import { date } from "zod"

const orderResolvers = {
  Query: {
    order: async (_: any, args: { _id: string }) => {
      try {
        const order = await Order.findById(args._id)

        if (!order)
          throw new GraphQLError("Order not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return order
      } catch (error) {
        throw error
      }
    },
    orders: async (
      _: any,
      { first, after, search, filter, sort }: IDataTableInput
    ) => {
      try {
        const matchStage: Record<string, any> = {}

        // Handle global search
        if (search)
          matchStage.$or = [{ customerName: { $regex: search, $options: "i" } }]

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
          if (type !== "order") throw new Error("Invalid cursor")
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
              customerName: 1,
              amountToBePaid: 1,
              dateReceived: { $arrayElemAt: ["$orderStatuses.date", 0] },
            },
          },
        ]

        // Fetch from DB
        const data = await Order.aggregate(pipeline)

        const edges = data.slice(0, first).map((edge) => ({
          node: edge,
          // Encode the cursor
          cursor: toCursor("order", edge._id.toString()),
        }))

        // Get total count (remove id and count all documents that match other criteria)
        const total = await Order.aggregate([
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
    createOrder: async (_: any, args: { input: IOrderInput }, context: any) => {
      try {
        if (!context.session)
          throw new GraphQLError("Unauthorized", {
            extensions: { code: "UNAUTHORIZED" },
          })
        const { dateReceived, ...rest } = args.input
        await Order.create({
          ...rest,
          orderStatuses: [
            {
              status: OrderStatus.RECEIVED,
              date: dateReceived,
              by: context.session.user._id,
            },
          ],
        })
        return {
          ok: true,
          message: "Order created successfully",
        }
      } catch (error) {
        throw error
      }
    },
    updateOrder: async (_: any, args: { input: IOrderInput }) => {
      try {
        const order = await Order.findByIdAndUpdate(
          args.input._id,
          args.input,
          {
            new: true,
          }
        )
        if (!order)
          throw new GraphQLError("Order not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return {
          ok: true,
          message: "Order updated successfully",
        }
      } catch (error) {
        throw error
      }
    },
    deleteOrder: async (_: any, args: { _id: string }) => {
      try {
        const order = await Order.findByIdAndDelete(args._id)
        if (!order)
          throw new GraphQLError("Order not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return {
          ok: true,
          message: "Order deleted successfully",
        }
      } catch (error) {
        throw error
      }
    },
  },
}

export default orderResolvers
