const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const uniqueValidator = require('mongoose-unique-validator')

const SALT_WORK_FACTOR = 10

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  name: String,
  password: { type: String, required: true },
  registries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registry'
    }
  ]
})

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR)
    this.password = await bcrypt.hash(this.password, salt)
    // return next()
  } catch (err) {
    // return next(err)
  }
})

userSchema.methods.validatePassword = async function validatePassword(data) {
  return bcrypt.compare(data, this.password)
}

userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the password should not be revealed
    delete returnedObject.password
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
