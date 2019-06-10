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

// root route
app.get('/', (req, res) => {
  res.send('<h1>Hello!</h1>');
});

// registries INDEX
app.get('/registries', (req, res) => {
  res.send(registries);
});

// registries SHOW
app.get('/registries/:id', (req, res) => {
  const id = Number(req.params.id);
  const registry = registries.find(registry => registry.id === id);

  if (registry) {
    res.json(registry);
  } else {
    res.status(404).end();
  }
});

// registries DESTROY
app.delete('/registries/:id', (req, res) => {
  const id = Number(req.params.id);
  const registry = registries.filter(registry => registry.id !== id);

  res.status(204).end();
  // res.json(registry);
});

// generate current registry id for post requests
const generateId = () => {
  const maxId =
    registries.length > 0 ? Math.max(...registries.map(n => n.id)) : 0;
  return maxId + 1;
};

// registries CREATE
app.post('/registries', (req, res) => {
  const body = req.body;

  if (!body.location) {
    return res.status(400).json({
      error: 'location missing',
    });
  }

  const registry = {
    location: body.location,
    date: new Date(),
    id: generateId,
  };

  registries = registries.concat(registry);

  res.json(registry);
});

// midleware to handle unknown endpoints
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' });
};
app.use(unknownEndpoint);

PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
});
