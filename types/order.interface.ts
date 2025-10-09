import { Document, ObjectId } from "mongoose"
import { IPageInfo } from "./shared.interface"
import { IUser } from "./user.interface"

export enum OrderStatus {
  RECEIVED = "RECEIVED",
  FOR_WASHING = "FOR_WASHING",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  RELEASED = "RELEASED",
  CANCELLED = "CANCELLED",
}

export interface IOrderStatusItem {
  status: OrderStatus
  date: Date
  by: IUser
}

export interface IOrder extends Document {
  _id: ObjectId
  customerName: string
  orderSlipURL: string
  amountToBePaid: number
  orderStatuses: IOrderStatusItem[]
}

export interface IOrderStatusInput {
  status: OrderStatus
  date: Date
  by: ObjectId
}

export interface IOrderInput extends Request {
  _id: ObjectId
  customerName: string
  orderSlipURL: string
  amountToBePaid: number
  dateReceived?: Date
  orderStatuses: IOrderStatusItem[]
}

export interface IOrderNode {
  _id: ObjectId
  customerName: string
  amountToBePaid: number
  dateReceived: Date
  currentStatus: OrderStatus
}

export interface IOrderEdge {
  node: IOrderNode
  cursor: string
}

export interface IOrderConnection {
  edges: IOrderEdge[]
  pageInfo: IPageInfo
}
