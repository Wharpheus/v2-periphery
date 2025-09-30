const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Agent Dashboard Server is running!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test successful' });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
