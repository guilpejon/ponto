const registriesRouter = require('express').Router()
const Registry = require('../models/Registry')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const logger = require('../../utils/logger')
const moment = require('moment')

const aws = require('aws-sdk')
aws.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
})
let rekognition = new aws.Rekognition()

const getTokenFrom = request => {
  const authorization = request.get('authorization')

  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

// registries INDEX
registriesRouter.get('/', async (req, res) => {
  // Registry.find({}).then(registries => {
  //   res.json(registries.map(registry => registry.toJSON()))
  // })
  const registries = await Registry
    .find({}).populate('user', { username: 1, name: 1 })
  res.json(registries.map(registry => registry.toJSON()))
})

// registries SHOW
registriesRouter.get('/:id', async (req, res) => {
  try{
    const register = await Registry.findById(req.params.id)
    if (register) {
      const imageKey = register.imageKey
      let params = {
        Bucket: process.env.AWS_BUCKET,
        Key: imageKey
      }
      let s3Bucket = new aws.S3( { params: { Bucket: process.env.AWS_BUCKET } } )
      const s3Image = await s3Bucket.getObject(params).promise()
      const s3ImageBase64 = Buffer.from(s3Image.Body).toString('base64')

      register.image = `data:${s3Image.ContentType};base64,${s3ImageBase64}`

      res.json(register.toJSON())
    } else {
      res.status(404).end()
    }
  } catch(exception) {
    logger.info(exception)
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
registriesRouter.post('/', async (req, res) => {
  const body = req.body
  const token = getTokenFrom(req)

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    let s3Bucket = new aws.S3( { params: { Bucket: process.env.AWS_BUCKET } } )
    const buf = new Buffer.from(req.body.image.replace(/^data:image\/\w+;base64,/, ''),'base64')
    const userId = decodedToken.id
    const imageKey = `${process.env.NODE_ENV}/${userId}/${moment().format('x')}`
    let params = {
      Key: imageKey,
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    }
    s3Bucket.putObject(params, async (err, data) => {
      if (err) {
        console.log(err)
        console.log('Error uploading data: ', data)
      } else {
        try {
          const user = await User.findById(userId)

          params = {
            Bucket: process.env.AWS_BUCKET,
            Key: imageKey
          }
          const s3Image = await s3Bucket.getObject(params).promise()

          params = {
            Image: {
              Bytes: s3Image.Body
            }
          }

          rekognition.detectText(params, async (err, data) => {
            if (err) {
              console.log(err, err.stack) // an error occurred
              res.status(400).send({ error: err })
            }
            else {
              let dateObject = data.TextDetections.find( element => {
                return element['DetectedText'].includes('PIS')
              })
              const dateLine = dateObject['DetectedText'].split(' ')
              const extractedDate = dateLine[0].split('/')
              const day = extractedDate[0]
              const month = extractedDate[1]
              const year = `20${extractedDate[2]}`
              const hour = dateLine[1]
              const date = new Date(`${year} ${month} ${day} ${hour}`).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

              const registry = new Registry({
                createdAt: date,
                imageKey,
                user: userId
              })

              const savedRegistry = await registry.save()
              user.registries = user.registries.concat(savedRegistry._id)
              await user.save()

              console.log('succesfully uploaded the image!')

              res.json(savedRegistry.toJSON())
            }
          })
        } catch(exception) {
          logger.info(exception)
          res.status(400).send({ error: exception })
        }
      }
    })
  } catch(exception) {
    logger.info(exception)
    res.status(400).send({ error: exception })
  }
})

// registries DESTROY
registriesRouter.delete('/:id', async (req, res) => {
  try {
    await Registry.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch(exception) {
    // logger.info(exception)
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

registriesRouter.put('/:id', (req, res) => {
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
      // logger.info(exception)
      res.status(400).send({ error: 'malformatted id' })
    })
})

module.exports = registriesRouter
