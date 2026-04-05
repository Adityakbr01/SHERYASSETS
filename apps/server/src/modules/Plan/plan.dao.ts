import { Plan } from './plan.model'
import type { IPlan, PlanCode } from './plan.type'

const PlanDAO = {
  async findByCode(code: PlanCode): Promise<IPlan | null> {
    return Plan.findOne({ code })
  },

  async findById(planId: string): Promise<IPlan | null> {
    return Plan.findById(planId)
  },

  async findAll(): Promise<IPlan[]> {
    return Plan.find().sort({ priceMonthly: 1 })
  },

  async upsertByCode(data: {
    code: PlanCode
    name: string
    priceMonthly: number
    limits: IPlan['limits']
    features: IPlan['features']
  }): Promise<IPlan> {
    return Plan.findOneAndUpdate(
      { code: data.code },
      { $set: data },
      { upsert: true, returnDocument: 'after' },
    ) as unknown as IPlan
  },

  async create(planData: Partial<IPlan>): Promise<IPlan> {
    return Plan.create(planData)
  },

  async update(planId: string, planData: Partial<IPlan>): Promise<IPlan> {
    return Plan.findByIdAndUpdate(planId, planData, { returnDocument: 'after' }) as unknown as IPlan
  },

  async delete(planId: string): Promise<IPlan> {
    return Plan.findByIdAndDelete(planId) as unknown as IPlan
  },
}

export default PlanDAO
