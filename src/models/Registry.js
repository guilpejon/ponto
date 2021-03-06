const mongoose = require('mongoose')
const moment = require('moment')
const mongoosePaginate = require('mongoose-paginate')

const RegistrySchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: moment()
  },
  imageKey: String,
  image: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

RegistrySchema.index({ createdAt: 1, user: 1 }, { unique: true })

RegistrySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    returnedObject.createdAt = returnedObject.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false })
    delete returnedObject.__v
  },
})

RegistrySchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Registry', RegistrySchema)
