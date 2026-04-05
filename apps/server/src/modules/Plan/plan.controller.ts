import type { Request, Response } from 'express'
import { asyncHandler } from '@/middlewares/asyncHandler'
import { ApiResponse } from '@/utils/ApiResponse'
import PlanService from './plan.service'

const PlanController = {
  getAllPlans: asyncHandler(async (_req: Request, res: Response) => {
    const plans = await PlanService.getAll()

    ApiResponse.success(res, {
      message: 'Plans fetched successfully',
      data: plans,
    })
  }),

  createPlan: asyncHandler(async (req: Request, res: Response) => {
    const plan = await PlanService.create(req.body)

    ApiResponse.success(res, {
      message: 'Plan created successfully',
      data: plan,
    })
  }),

  updatePlan: asyncHandler(async (req: Request, res: Response) => {
    const plan = await PlanService.update(req.params.id as string, req.body)

    ApiResponse.success(res, {
      message: 'Plan updated successfully',
      data: plan,
    })
  }),

  deletePlan: asyncHandler(async (req: Request, res: Response) => {
    const plan = await PlanService.delete(req.params.id as string)

    ApiResponse.success(res, {
      message: 'Plan deleted successfully',
      data: plan,
    })
  }),
}

export default PlanController
