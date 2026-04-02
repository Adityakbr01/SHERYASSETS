import User from './user.model'
import type { IUser } from './user.type'

const UserDAO = {
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId)
  },

  async findByEmail(email: string, includeSecrets = false): Promise<IUser | null> {
    const query = User.findOne({ email })

    if (includeSecrets) {
      query.select('+passwordHash +refreshToken')
    }

    return query
  },

  async findByIdWithRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<IUser | null> {
    return User.findOne({ _id: userId, refreshToken }).select('+refreshToken')
  },

  async create(payload: {
    name: string
    email: string
    passwordHash: string
  }): Promise<IUser> {
    return User.create(payload)
  },

  async clearRefreshToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } })
  },
}

export default UserDAO
