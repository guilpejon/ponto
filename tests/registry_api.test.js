const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')
const Registry = require('../src/models/Registry')
const moment = require('moment')

beforeEach(async () => {
  await Registry.deleteMany({})

  let registryObject = new Registry(helper.initialRegistries[0])
  await registryObject.save()
})

test('registries are returned as json', async () => {
  await api
    .get('/api/registries')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all registries are returned', async () => {
  const response = await api.get('/api/registries')

  expect(response.body.length).toBe(helper.initialRegistries.length)
})

test('a registry with createdAt can be added', async () => {
  const now = moment()
  const newRegistry = new Registry({
    createdAt: now
  })

  await api
    .post('/api/registries')
    .send(newRegistry)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const registriesAtEnd = await helper.registriesInDb()
  const response = await api.get('/api/registries')
  expect(response.body.length).toBe(helper.initialRegistries.length + 1)

  const registriesCreatedAt = registriesAtEnd.map(r => moment(r.createdAt).format())
  expect(registriesCreatedAt).toContain(now.format())
})

test('an empty registry can be added', async () => {
  const now = moment()
  const newRegistry = new Registry({})

  await api
    .post('/api/registries')
    .send(newRegistry)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const registriesAtEnd = await helper.registriesInDb()
  const response = await api.get('/api/registries')
  expect(response.body.length).toBe(helper.initialRegistries.length + 1)

  // const registriesCreatedAt = registriesAtEnd.map(r => moment(r.createdAt).format())
  // expect(registriesCreatedAt).toContain(now.format())
})

test('registry with createdAt in the past cannot be added', async () => {
  const yesterday = moment().subtract(1, 'day')
  const newRegistry = new Registry({
    createdAt: yesterday
  })

  await api
    .post('/api/registries')
    .send(newRegistry)
    .expect(400)

  const registriesAtEnd = await helper.registriesInDb()
  const response = await api.get('/api/registries')

  expect(response.body.length).toBe(helper.initialRegistries.length)
})

test('a specific registry can be viewed', async () => {
  const notesAtStart = await helper.registriesInDb()
  const registryToView = notesAtStart[0]

  const resultRegistry = await api
    .get(`/api/registries/${registryToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(resultRegistry.body.id).toEqual(registryToView.id)
})

test('a specific registry cannot be seen if it doesnt exist', async () => {
  const resultRegistry = await api
    .get('/api/registries/5d0eb9019e390f65e8050561')
    .expect(404)
})

test('a specific registry cannot be seen if id is invalid', async () => {
  const resultRegistry = await api
    .get('/api/registries/wrong_id')
    .expect(400)
})

test('a registry can be deleted', async () => {
  const notesAtStart = await helper.registriesInDb()
  const registryToDelete = notesAtStart[0]

  await api
    .delete(`/api/registries/${registryToDelete.id}`)
    .expect(204)

  const registriesAtEnd = await helper.registriesInDb()

  expect(registriesAtEnd.length).toBe(
    helper.initialRegistries.length - 1
  )

  // const contents = registriesAtEnd.map(r => r.content)
  // expect(contents).not.toContain(registryToDelete.content)
})

afterAll(() => {
  mongoose.connection.close()
})
