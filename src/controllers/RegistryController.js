const registryRouter = require('express').Router()
const Registry = require('../models/Registry')
const moment = require('moment')

// registries INDEX
registryRouter.get('/', async (req, res) => {
  // Registry.find({}).then(registries => {
  //   res.json(registries.map(registry => registry.toJSON()))
  // })
  const registries = await Registry.find({})
  res.json(registries.map(registry => registry.toJSON()))
})

// registries SHOW
registryRouter.get('/:id', async (req, res) => {
  try{
    const register = await Registry.findById(req.params.id)
    if (register) {
      res.json(register.toJSON())
    } else {
      res.status(404).end()
    }
  } catch(exception) {
    console.log(exception)
    res.status(400).send({ error: 'malformatted id' })
  }

  // Registry.findById(req.params.id)
  //   .then(registry => {
  //     if (registry) {
  //       res.json(registry.toJSON())
  //     } else {
  //       res.status(404).end()
  //     }
  //   })
  //   .catch(error => {
  //     console.log(error)
  //     res.status(400).send({ error: 'malformatted id' })
  //   })
})

// registries CREATE
registryRouter.post('/', async (req, res) => {
  const body = req.body
  const registry = new Registry({
    createdAt: body.createdAt
  })

  try {
    const savedRegistry = await registry.save()
    res.json(savedRegistry.toJSON())
  } catch(exception) {
    console.log(exception)
    res.status(400).send({ error: exception })
  }

  // registry
  //   .save()
  //   .then(savedRegistry => savedRegistry.toJSON())
  //   .then(savedAndFormattedRegistry => {
  //     res.json(savedAndFormattedRegistry)
  //   })
  //   .catch(error => {
  //     console.log(error)
  //     res.status(400).send({ error: error.messages })
  //   })
})

// registries DESTROY
registryRouter.delete('/:id', async (req, res) => {
  try {
    await Registry.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch(exception) {
    console.log(exception)
    res.status(400).send({ error: 'malformatted id' })
  }

  // Registry.findByIdAndRemove(req.params.id)
  //   .then(() => {
  //     res.status(204).end()
  //   })
  //   .catch(error => {
  //     console.log(error)
  //     res.status(400).send({ error: 'malformatted id' })
  //   })

  // res.status(204).end()
})

registryRouter.put('/:id', (req, res) => {
  const body = req.body

  const registry = {
    createdAt: body.createdAt,
  }

  Registry.findByIdAndUpdate(req.params.id, registry, { new: true })
    .then(updatedRegistry => updatedRegistry.toJSON)
    .then(updatedAndFormattedRegistry => {
      res.json(updatedAndFormattedRegistry)
    })
    .catch(error => {
      console.log(error)
      res.status(400).send({ error: 'malformatted id' })
    })
})

module.exports = registryRouter
