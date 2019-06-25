const config = require('./utils/config')
const express = require('express')
const bodyParser = require('body-parser')
const app = express() // app initialization
const registriesRouter = require('./src/controllers/RegistryController')
const usersRouter = require('./src/controllers/UserController')
const loginRouter = require('./src/controllers/Login')
const middleware = require('./utils/middleware')
const mongoose = require('mongoose')
const cors = require('cors')
const logger = require('./utils/logger')

mongoose.set('useFindAndModify', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

app.use(cors())

app.use(express.static('build'))
app.use(bodyParser.json())
// app.use(middleware.requestLogger)

app.use('/api/registries', registriesRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

app.use(middleware.unknownEndpoint)
// app.use(middleware.errorHandler)

module.exports = app
