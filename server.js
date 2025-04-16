const app = require('./index.js');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Local server running on http://localhost:${PORT}`);
});