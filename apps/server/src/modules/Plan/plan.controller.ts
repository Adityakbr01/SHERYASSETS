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
}

export default PlanController
