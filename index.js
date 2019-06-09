const express = require('express');

// app initialization
const app = express();

// root route
app.get('/', (req, res) => {
  res.send('<h1>Hello!</h1>');
});

PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
});
