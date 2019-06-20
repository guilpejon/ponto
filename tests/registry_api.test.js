const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

test('registries are returned as json', async () => {
  await api
    .get('/api/registries')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

// test('there are five registries', async () => {
//   const response = await api.get('/api/registries')

//   expect(response.body.length).toBe(4)
// })

// test('the first registry was created today', async () => {
//   const response = await api.get('/api/registries')

//   expect(response.body[0].content).toBe('HTML is easy')
// })

afterAll(() => {
  mongoose.connection.close()
})
