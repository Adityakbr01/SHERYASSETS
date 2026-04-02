import type { Document, Types } from 'mongoose'

// ─── User Interface (tenant-agnostic) ────────────────────────────────────────

export interface USER {
  _id: string
  name: string
  email: string
  passwordHash: string
  isEmailVerified: boolean
  refreshToken?: string | null
  createdAt: Date
  updatedAt: Date
}

export type PublicUser = Omit<USER, 'passwordHash' | 'refreshToken'>

export interface IUser extends Omit<USER, '_id' | 'createdAt' | 'updatedAt'>, Document {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
  generateAuthToken(activeTenantId?: string): string
  generateRefreshToken(): string
}
