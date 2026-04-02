import { Router } from 'express'
import PlanController from './plan.controller'

const planRouter = Router()

// Public — anyone can view available plans
planRouter.get('/', PlanController.getAllPlans)

export default planRouter
