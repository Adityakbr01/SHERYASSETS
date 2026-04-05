import { authenticateUser, requireSystemRole } from '@/middlewares/auth.middleware'
import { validate } from '@/middlewares/validate.middleware'
import { Router } from 'express'
import PlanController from './plan.controller'
import { createPlanSchema, deletePlanSchema, updatePlanSchema } from './plan.validation'

const planRouter = Router()

// Public — anyone can view available plans
planRouter.get('/', PlanController.getAllPlans)

// Protected — only authenticated users can access
planRouter.use(authenticateUser)

// add role based access control admin can crud on Plan
planRouter.use(requireSystemRole(['admin']))

planRouter.post('/', validate(createPlanSchema), PlanController.createPlan)
planRouter.put('/:id', validate(updatePlanSchema), PlanController.updatePlan)
planRouter.delete('/:id', validate(deletePlanSchema), PlanController.deletePlan)

export default planRouter
