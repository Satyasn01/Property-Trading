const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Require route modules
const propertyRoutes = require('./api/properties');  // Adjusted path assuming /api/properties/index.js
const orderRoutes = require('./api/orders');         // Adjusted path assuming /api/orders/index.js
const fundsRoutes = require('./api/funds');         // Make sure the path and casing are correct

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route setup
app.use('/api/properties', propertyRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/funds', fundsRoutes); 

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
