// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const propertyRoutes = require('./property');
const heatRoutes = require('./heat');
const electricityRoutes = require('./electricity');
const waterRoutes = require('./water');

app.use(cors());
app.use(express.json());
app.use('/property', propertyRoutes);
app.use('/heat', heatRoutes);
app.use('/electricity', electricityRoutes);
app.use('/water', waterRoutes);

const PORT = process.env.PORT || 2992;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
