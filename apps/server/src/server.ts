import app from '@/app'
import ENV from './configs/ENV'

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`)
})
