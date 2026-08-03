const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const scootyRoutes = require('./routes/scootyRoutes');
const rideRoutes = require('./routes/rideRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // condition photos

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'bike-flux-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/scooties', scootyRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/wallet', walletRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Bike Flux backend running on port ${PORT}`));
