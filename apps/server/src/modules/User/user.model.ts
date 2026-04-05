import { env } from '@/configs/ENV'
import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import mongoose, { Schema } from 'mongoose'
import { type IUser } from './user.type'

const authTokenExpiry = env.JWT_EXPIRES_IN as SignOptions['expiresIn']
const refreshTokenExpiry = env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
)

// ─── Hooks ─────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('passwordHash')) return
  const salt = await bcrypt.genSalt(env.SALT_ROUNDS)
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
})

// ─── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.generateAuthToken = function (activeTenantId?: string): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
  }

  return jwt.sign(
    {
      userId: this._id.toString(),
      email: this.email,
      role: this.role,
      ...(activeTenantId && { activeTenantId }),
    },
    env.JWT_SECRET,
    {
      expiresIn: authTokenExpiry,
    },
  )
}

userSchema.methods.generateRefreshToken = function (): string {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined')
  }

  const token = jwt.sign({ userId: this._id.toString() }, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenExpiry,
  })

  this.refreshToken = token
  return token
}



const User = mongoose.model<IUser>('User', userSchema)
export default User
