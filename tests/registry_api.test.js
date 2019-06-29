const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')
const Registry = require('../src/models/Registry')
const User = require('../src/models/User')
const moment = require('moment')

describe('when there is initially some registries saved', () => {
  beforeEach(async () => {
    await Registry.deleteMany({})

    // promises are executed in random order
    const registryObjects = helper.initialRegistries
      .map(registry => new Registry(registry))
    const promiseRegistriesArray = registryObjects.map(registry => registry.save())
    await Promise.all(promiseRegistriesArray) // wait for all the promises to end

    await User.deleteMany({})
    const user = await api
      .post('/api/users')
      .send({ username: 'root', password: 'password' })

    // DOES NOT WORK, forEach does not wait for async calls to end
    // helper.initialRegistries.forEach(async (registry) => {
    //   let registryObject = new Registry(registry)
    //   await registryObject.save()
    // })
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

  describe('viewing a specific registry', () => {
    test('succeeds with a valid id', async () => {
      const registriesAtStart = await helper.registriesInDb()
      const registryToView = registriesAtStart[0]

      const resultRegistry = await api
        .get(`/api/registries/${registryToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      expect(resultRegistry.body.id).toEqual(registryToView.id)
    })

    test('fails with 404 if registry does not exist', async () => {
      const validNonExistingId = await helper.nonExistingId()

      const resultRegistry = await api
        .get(`/api/registries/${validNonExistingId}`)
        .expect(404)
    })

    test('fail with 400 if id is invalid', async () => {
      const invalidId = '5a3d5da59070081a82a3445'

      const resultRegistry = await api
        .get(`/api/registries/${invalidId}`)
        .expect(400)
    })
  })

  describe('addition of a new registry', () => {
    let jwt

    beforeEach(async () => {
      const response = await api
        .post('/api/login')
        .send({ username: 'root', password: 'password' })
      jwt = response.body.token
    })

    test('succeeds setting a valid createdAt value', async () => {
      const now = moment()
      const newRegistry = new Registry({
        createdAt: now
      })

      const usersAtStart = await helper.usersInDb()
      const user = usersAtStart[0]

      await api
        .post('/api/registries')
        .set('Authorization', `Bearer ${jwt}`)
        .send(newRegistry)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const registriesAtEnd = await helper.registriesInDb()
      const response = await api.get('/api/registries')
      expect(response.body.length).toBe(helper.initialRegistries.length + 1)

      const registriesCreatedAt = registriesAtEnd.map(r => moment(r.createdAt).format())
      expect(registriesCreatedAt).toContain(now.format())
    })

    test('succeeds without setting a createdAt value', async () => {
      const now = moment()
      const newRegistry = new Registry({})

      await api
        .post('/api/registries')
        .set('Authorization', `Bearer ${jwt}`)
        .send(newRegistry)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const registriesAtEnd = await helper.registriesInDb()
      const response = await api.get('/api/registries')
      expect(response.body.length).toBe(helper.initialRegistries.length + 1)

      // const registriesCreatedAt = registriesAtEnd.map(r => moment(r.createdAt).format())
      // expect(registriesCreatedAt).toContain(now.format())
    })

    test('fails with 400 setting an invalid createdAt value', async () => {
      const yesterday = moment().subtract(1, 'day')
      const newRegistry = new Registry({
        createdAt: yesterday
      })

      await api
        .post('/api/registries')
        .set('Authorization', `Bearer ${jwt}`)
        .send(newRegistry)
        .expect(400)

      const registriesAtEnd = await helper.registriesInDb()
      const response = await api.get('/api/registries')

      expect(response.body.length).toBe(helper.initialRegistries.length)
    })
  })

  describe('deletion of a registry', () => {
    test('succeeds with 204 if id is valid', async () => {
      const registriesAtStart = await helper.registriesInDb()
      const registryToDelete = registriesAtStart[0]

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
  })
})

describe('when there is initially one user at db', () => {
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'user_name',
      name: 'User Name',
      password: 'password'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'User Name',
      password: 'password'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error.errors.username.message).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
