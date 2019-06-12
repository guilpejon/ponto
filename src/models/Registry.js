const mongoose = require('mongoose');

const RegistrySchema = new mongoose.Schema({
  // geolocation: {
  //   type: String,
  //   required: false,
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

RegistrySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('Registry', RegistrySchema);
