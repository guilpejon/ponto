const jwt = require('jsonwebtoken')
const loginRouter = require('express').Router()
const User = require('../models/User')

loginRouter.post('/', async (req, response) => {
  const body = req.body

  const user = await User.findOne({ username: body.username })

  if (!user) return response.status(401).json({ error: 'invalid username or password' })

  if (user.validatePassword(body.password)) {
    const userForToken = {
      username: user.username,
      id: user._id,
    }

    const token = jwt.sign(userForToken, process.env.SECRET)

    response
      .status(200)
      .send({ token, username: user.username, name: user.name })

  } else {
    return response.status(401).json({ error: 'invalid username or password' })
  }
})

module.exports = loginRouter
