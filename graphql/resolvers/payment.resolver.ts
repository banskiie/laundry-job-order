import { endOfDay, startOfDay } from "date-fns"
import { GraphQLError } from "graphql"
import { Types, type PipelineStage } from "mongoose"
import { fromCursor, toCursor } from "@/helpers/cursor"
import Payment from "@/models/payment.model"
import type { IDataTableInput } from "@/types/shared.interface"
import { type IPaymentInput } from "@/types/payment.interface"
import Order from "@/models/order.model"
import { OrderStatus, PaymentStatus } from "@/types/order.interface"
import { pusherServer } from "@/lib/pusher"

const paymentResolvers = {
  Query: {
    payment: async (_: any, args: { _id: string }) => {
      try {
        const payment = await Payment.findById(args._id).populate("order")

        if (!payment)
          throw new GraphQLError("Payment not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return payment
      } catch (error) {
        throw error
      }
    },
    payments: async (
      _: any,
      { first, after, search, filter, sort }: IDataTableInput
    ) => {
      try {
        const matchStage: Record<string, any> = {}

        // Handle global search
        if (search)
          matchStage.$or = [
            { customerName: { $regex: search, $options: "i" } },
            { paymentMethod: { $regex: search, $options: "i" } },
            { amountPaid: Number(search) },
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
          if (type !== "payment") throw new Error("Invalid cursor")
          matchStage._id = {
            // If sort is provided, use it to determine the direction of pagination
            ...(sort && sort?.order === "ASC"
              ? { $gt: new Types.ObjectId(id) }
              : { $lt: new Types.ObjectId(id) }),
          }
        }

        // Aggregation Pipeline
        const pipeline: PipelineStage[] = [
          {
            $lookup: {
              from: "orders",
              localField: "order",
              foreignField: "_id",
              as: "order",
            },
          },
          { $unwind: "$order" },
          {
            $addFields: {
              customerName: "$order.customerName",
            },
          },
          { $match: matchStage },
          {
            $sort: {
              ...(sort
                ? { [sort.key]: sort.order === "ASC" ? 1 : -1 }
                : { updatedAt: -1 }), // Default to sorting by latest _id if no sort is provided
            },
          },
          { $limit: first + 1 },
          {
            $project: {
              customerName: 1,
              amountPaid: 1,
              datePaid: 1,
              paymentMethod: 1,
            },
          },
        ]

        // Fetch from DB
        const data = await Payment.aggregate(pipeline)

        const edges = data.slice(0, first).map((edge) => ({
          node: edge,
          // Encode the cursor
          cursor: toCursor("payment", edge._id.toString()),
        }))

        // Get total count (remove id and count all documents that match other criteria)
        const total = await Payment.aggregate([
          {
            $addFields: {
              dateReceived: { $arrayElemAt: ["$paymentStatuses.date", 0] },
              currentStatus: { $arrayElemAt: ["$paymentStatuses.status", -1] },
              paymentStatus: { $arrayElemAt: ["$paymentStatuses.status", -1] },
            },
          },
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
    uploadPayment: async (
      _: any,
      args: { input: IPaymentInput },
      context: any
    ) => {
      try {
        if (!context.session)
          throw new GraphQLError("Unauthorized", {
            extensions: { code: "UNAUTHORIZED" },
          })
        const { isFullyPaid, ...rest } = args.input
        await Payment.create(rest)
        const currentOrder = await Order.findById(args.input.order)
        await pusherServer.trigger("tables", "refresh-table", {
          ok: true,
          message: `New payment of ₱${args.input.amountPaid} uploaded for ${currentOrder?.customerName}`,
        })
        if (!currentOrder)
          throw new GraphQLError("Order not found", {
            extensions: { code: "NOT_FOUND" },
          })
        if (isFullyPaid) {
          currentOrder.paymentStatuses.push({
            status: PaymentStatus.PAID,
            date: new Date(),
            by: context.session.user._id,
          })
          currentOrder.orderStatuses.push({
            status: OrderStatus.VERIFIED,
            date: new Date(),
            by: context.session.user._id,
          })
        } else {
          currentOrder.paymentStatuses.push({
            status: PaymentStatus.PARTIALLY_PAID,
            date: new Date(),
            by: context.session.user._id,
          })
        }
        await currentOrder.save()
        return {
          ok: true,
          message: "Payment uploaded successfully",
        }
      } catch (error) {
        throw error
      }
    },
    updatePayment: async (_: any, args: { input: IPaymentInput }) => {
      try {
        const payment = await Payment.findByIdAndUpdate(
          args.input._id,
          args.input,
          {
            new: true,
          }
        )
        await pusherServer.trigger("tables", "refresh-table", {
          ok: true,
          message: `Payment updated for ${payment?.customerName}`,
        })
        if (!payment)
          throw new GraphQLError("Payment not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return {
          ok: true,
          message: "Payment updated successfully",
        }
      } catch (error) {
        throw error
      }
    },
    deletePayment: async (_: any, args: { _id: string }) => {
      try {
        const payment = await Payment.findByIdAndDelete(args._id)
        if (!payment)
          throw new GraphQLError("Payment not found", {
            extensions: { code: "NOT_FOUND" },
          })
        return {
          ok: true,
          message: "Payment deleted successfully",
        }
      } catch (error) {
        throw error
      }
    },
  },
}

export default paymentResolvers
