const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const propertiesRouter = require('./properties');  // Adjust path if necessary
const app = express();

// Port configuration for the server
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());  // Enable CORS
app.use(bodyParser.json());  // Parse JSON bodies

// API route configurations
app.use('/api/properties', propertiesRouter);

// Catch-all route for testing server is running
app.get('/', (req, res) => {
  res.status(200).send("Welcome to the Real Estate API!");
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
