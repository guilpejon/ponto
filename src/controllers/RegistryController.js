const registriesRouter = require('express').Router()
const Registry = require('../models/Registry')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const logger = require('../../utils/logger')
const moment = require('moment')

let aws = require('aws-sdk')

aws.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
})

const getTokenFrom = request => {
  const authorization = request.get('authorization')

  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

// registries INDEX
registriesRouter.get('/', async (req, res) => {
  const token = getTokenFrom(req)

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    const userId = decodedToken.id
    const user = await User.findById(userId)

    // const registries = await Registry.find({}).populate('user', { username: 1, name: 1 })
    // let registries = await Registry.find({
    //   user: user
    // })

    const { page = 1, limit = 5 } = req.query
    const registries = await Registry.paginate({ user }, { page, limit: Number(limit), sort: {'createdAt': 'desc' }})

    // let params = {
    //   Bucket: process.env.AWS_BUCKET
    // }
    // let s3Bucket = new aws.S3( { params } )
    // let s3Image, s3ImageBase64, imageKey

    // registries = await Promise.all(registries.map(async (registry) => {
    //   imageKey = registry.imageKey
    //   params['Key'] = imageKey
    //   s3Image = await s3Bucket.getObject(params).promise()
    //   s3ImageBase64 = Buffer.from(s3Image.Body).toString('base64')
    //   registry.image = `data:${s3Image.ContentType};base64,${s3ImageBase64}`
    //   return registry
    // }))

    // res.json(registries.docs.map(registry => registry.toJSON()))
    res.json(registries)
  } catch(exception) {
    logger.info(exception)
    res.status(400).send({ error: exception })
  }
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

// amazon rekognition
registriesRouter.post('/rekognition', async (req, res) => {
  const token = getTokenFrom(req)

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    const base64Image = req.body.image.base64
    const buf = new Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''),'base64')
    const params = {
      Image: {
        Bytes: buf
      }
    }

    let rekognition = new aws.Rekognition()
    rekognition.detectText(params, async (err, data) => {
      if (err) {
        console.log(err, err.stack) // an error occurred
        res.status(400).send({ error: err })
      }
      else {
        try {
          const regex = /(\d{2}\/\d{2}\/\d{2})|(\d{2}:\d{2})/g
          let dateLine, extractedDate, extractedHour, hour, minute
          data.TextDetections.find( element => {
            if (element['Type'] === 'LINE') {
              if (element['DetectedText'].includes('PIS')) {
                dateLine = element['DetectedText'].replace(/\s/g, '').match(regex)
                if (dateLine !== null) {
                  extractedDate = dateLine[0]
                  extractedHour = dateLine[1]
                  hour = extractedHour.split(':')[0]
                  minute = extractedHour.split(':')[1]
                  if (typeof extractedDate !== 'undefined' && typeof extractedHour !== 'undefined') {
                    return
                  }
                }
              }
            }
          })
          let [extractedDay, extractedMonth, extractedYear] = extractedDate.split('/')
          extractedYear = `20${extractedYear}`
          // I have no idea why I have to do this to make the createdAt date retrieve by mongoose work correctly
          const date = new Date(extractedYear, extractedDay - 1, extractedMonth, hour, minute, 0).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
          // console.log(date)
          res.status(200).send({ date, image: base64Image })
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

          const s3Params = {
            Bucket: process.env.AWS_BUCKET,
            Key: imageKey
          }
          const s3Image = await s3Bucket.getObject(s3Params).promise()

          params = {
            Image: {
              Bytes: s3Image.Body
            }
          }

          let rekognition = new aws.Rekognition()
          rekognition.detectText(params, async (err, data) => {
            if (err) {
              console.log(err, err.stack) // an error occurred
              res.status(400).send({ error: err })
            }
            else {
              const regex = /(\d{2}\/\d{2}\/\d{2})|(\d{2}:\d{2})/g
              let dateLine, extractedDate, extractedHour, hour, minute
              data.TextDetections.find( element => {
                if (element['Type'] === 'LINE') {
                  if (element['DetectedText'].includes('PIS')) {
                    dateLine = element['DetectedText'].replace(/\s/g, '').match(regex)
                    if (dateLine !== null) {
                      extractedDate = dateLine[0]
                      extractedHour = dateLine[1]
                      hour = extractedHour.split(':')[0]
                      minute = extractedHour.split(':')[1]
                      if (typeof extractedDate !== 'undefined' && typeof extractedHour !== 'undefined') {
                        return
                      }
                    }
                  }
                }
              })
              let [extractedDay, extractedMonth, extractedYear] = extractedDate.split('/')
              extractedYear = `20${extractedYear}`
              // I have no idea why I have to do this to make the createdAt date retrieve by mongoose work correctly
              const date = new Date(extractedYear, extractedDay - 1, extractedMonth, hour, minute, 0).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
              // console.log(date)

              let registry = await Registry.find({ createdAt: date, user: userId })

              if (registry.length !== 0) {
                await s3Bucket.deleteObject(s3Params).promise()
                res.status(200).send()
              } else {
                registry = new Registry({
                  createdAt: date,
                  imageKey,
                  user: userId
                })

                const savedRegistry = await registry.save()
                user.registries = user.registries.concat(savedRegistry._id)
                await user.save()

                res.json(savedRegistry.toJSON())
              }
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
