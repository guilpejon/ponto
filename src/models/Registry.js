const mongoose = require('mongoose')
const moment = require('moment')

const RegistrySchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: moment(),
    min: moment().subtract(1, 'minute')
  },
})

RegistrySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Registry', RegistrySchema)
