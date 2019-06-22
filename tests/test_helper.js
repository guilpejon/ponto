const Registry = require('../src/models/Registry')
const moment = require('moment')

const initialRegistries = [
  {
    createdAt: moment()
  }
]

const nonExistingId = async () => {
  const note = new Registry()
  await note.save()
  await note.remove()

  return note._id.toString()
}

const registriesInDb = async () => {
  const registries = await Registry.find({})
  return registries.map(registry => registry.toJSON())
}

module.exports = {
  initialRegistries, nonExistingId, registriesInDb
}
