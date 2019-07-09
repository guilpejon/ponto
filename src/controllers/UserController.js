const usersRouter = require('express').Router()
const User = require('../models/User')

usersRouter.get('/', async (req, res) => {
  const users = await User
    .find({}).populate('registries', { createdAt: 1 })

  res.json(users.map(u => u.toJSON()))
})

usersRouter.post('/', async (req, res) => {
  try {
    const body = req.body

    const user = new User({
      username: body.username,
      name: body.name,
      email: body.email,
      password: body.password
    })

    const savedUser = await user.save()

    res.json(savedUser)
  } catch(exception) {
    // console.log(exception)
    res.status(400).send({ error: exception })
  }
})

usersRouter.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch(exception) {
    res.status(400).send({ error: 'malformatted id' })
  }
})

module.exports = usersRouter
