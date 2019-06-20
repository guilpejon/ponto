const registryRouter = require('express').Router()
const Registry = require('../models/Registry')

// registries INDEX
registryRouter.get('/', (req, res) => {
  Registry.find({}).then(registries => {
    res.json(registries.map(registry => registry.toJSON()))
  })
})

// registries SHOW
registryRouter.get('/:id', (req, res) => {
  Registry.findById(req.params.id)
    .then(registry => {
      if (registry) {
        res.json(registry.toJSON())
      } else {
        res.status(404).end()
      }
    })
    .catch(error => {
      console.log(error)
      res.status(400).send({ error: 'malformatted id' })
    })
})

// registries CREATE
registryRouter.post('/', (req, res) => {
  // const body = req.body
  // if (!body.location) {
  //   return res.status(400).json({
  //     error: 'location missing',
  //   });
  // }

  const registry = new Registry({
    // location: body.location,
    date: new Date(),
  })

  registry
    .save()
    .then(savedRegistry => savedRegistry.toJSON())
    .then(savedAndFormattedRegistry => {
      res.json(savedAndFormattedRegistry)
    })
    .catch(error => {
      console.log(error)
      res.status(400).send({ error: error.messages })
    })
})

// registries DESTROY
registryRouter.delete('/:id', (req, res) => {
  Registry.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(error => {
      console.log(error)
      res.status(400).send({ error: 'malformatted id' })
    })

  res.status(204).end()
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
