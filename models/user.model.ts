import { model, models, Schema } from "mongoose"
import { Role, type IUser } from "../types/user.interface"
import bcrypt from "bcryptjs"

const User = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.ADMIN,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

User.pre("save", async function (next) {
  if (!this.password) {
    this.password = await bcrypt.hash(this.username, 10)
  }
  next()
})

export default models.User || model<IUser>("User", User)
