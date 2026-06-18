const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Mehran Gifts Full-Stack Server Running!`);
  console.log(`   Local URL:   http://localhost:${PORT}`);
  console.log(`   Admin URL:   http://localhost:${PORT}/admin.html`);
  console.log(`==================================================`);
});
