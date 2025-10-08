import { Document, ObjectId } from "mongoose"
import { IPageInfo } from "./shared.interface"

export enum Role {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  CASHIER = "CASHIER",
}

export interface IUser extends Document {
  _id: ObjectId
  name: string
  username: string
  password?: string
  role: Role
  isActive: boolean
}

export interface IUserInput extends Request {
  _id: ObjectId
  name: string
  username: string
  password?: string
  role: Role
  isActive: boolean
}

export interface IUserNode {
  _id: ObjectId
  name: string
  username: string
  role: Role
  isActive: boolean
}

export interface IUserEdge {
  node: IUserNode
  cursor: string
}

export interface IUserConnection {
  edges: IUserEdge[]
  pageInfo: IPageInfo
}
