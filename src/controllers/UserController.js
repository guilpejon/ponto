const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/User')

usersRouter.post('/', async (req, res) => {
  try {
    const body = req.body

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
      username: body.username,
      name: body.name,
      passwordHash
    })

    const savedUser = await user.save()

    res.json(savedUser)
  } catch(exception) {
    console.log(exception)
    res.status(400).send({ error: exception })
  }
})

module.exports = usersRouter
