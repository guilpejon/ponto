require('dotenv').config();
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const express = require('express');
const app = express(); // app initialization

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

let registries = [
  {
    id: 1,
    date: '2019-05-30T19:20:14.298Z',
    location: {
      lat: 51.0,
      lng: -0.1,
      accuracy: 20,
    },
  },
  {
    id: 2,
    date: '2019-06-08T13:15:25.298Z',
    location: {
      lat: -0.1,
      lng: 51.0,
      accuracy: 50,
    },
  },
];

const url = process.env.MONGODB_URI;
mongoose
  .connect(url, { useNewUrlParser: true })
  .then(result => {
    console.log('connected to MongoDB');
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message);
  });
const Registry = require('./src/models/registry');

// root route
app.get('/', (req, res) => {});

// registries INDEX
app.get('/api/registries', (req, res) => {
  Registry.find({}).then(registries => {
    res.json(registries.map(registry => registry.toJSON()));
  });
});

// registries SHOW
app.get('/api/registries/:id', (req, res) => {
  Registry.findById(req.params.id)
    .then(registry => {
      if (registry) {
        res.json(registry.toJSON());
      } else {
        res.status(404).end();
      }
    })
    .catch(error => {
      console.log(error);
      res.status(400).send({ error: 'malformatted id' });
    });
});

// registries DESTROY
app.delete('/api/registries/:id', (req, res) => {
  Registry.findByIdAndRemove(req.params.id)
    .then(result => {
      res.status(204).end();
    })
    .catch(error => {
      console.log(error);
      res.status(400).send({ error: 'malformatted id' });
    });

  res.status(204).end();
});

// generate current registry id for post requests
const generateId = () => {
  const maxId =
    registries.length > 0 ? Math.max(...registries.map(n => n.id)) : 0;
  return maxId + 1;
};

// registries CREATE
app.post('/api/registries', (req, res) => {
  const body = req.body;

  // if (!body.location) {
  //   return res.status(400).json({
  //     error: 'location missing',
  //   });
  // }

  const registry = new Registry({
    // location: body.location,
    date: new Date(),
  });

  res.json(registry);

  registry
    .save()
    .then(savedRegistry => {
      res.json(registry.toJSON);
    })
    .catch(error => {
      console.log(error);
      res.status(400).send({ error: error.messages });
    });
});

app.put('/api/registries/:id', (req, res) => {
  const body = req.body;

  const registry = {
    createdAt: body.createdAt,
  };

  Registry.findByIdAndUpdate(req.params.id, registry, { new: true })
    .then(updatedRegistry => {
      res.json(updatedRegistry.toJSON());
    })
    .catch(error => {
      console.log(error);
      res.status(400).send({ error: 'malformatted id' });
    });
});

// midleware to handle unknown endpoints
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' });
};
app.use(unknownEndpoint);

PORT = process.env.PORT;
app.listen(PORT, () => {
  // console.log(`Server running on ${PORT}`);
});
