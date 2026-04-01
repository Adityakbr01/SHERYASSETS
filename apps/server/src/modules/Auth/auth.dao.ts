import User from '@/modules/User/user.model'
import type { IUser, USERROLE } from '@/modules/User/user.type'

type CreateUserInput = {
  name: string
  email: string
  passwordHash: string
  tenantId: string
  role: USERROLE
}

const AuthDAO = {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email })

    if (includePassword) {
      query.select('+passwordHash +refreshToken')
    }

    return query
  },

  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId)
  },

  async findByIdAndRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<IUser | null> {
    return User.findOne({ _id: userId, refreshToken }).select('+refreshToken')
  },

  async createUser(payload: CreateUserInput): Promise<IUser> {
    return User.create(payload)
  },

  async clearRefreshToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          refreshToken: null,
        },
      },
      { returnDocument: 'after' },
    )
  },
}

export default AuthDAO
