const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors()); 
app.use(bodyParser.json());

let parkingLots = {
  "lot-001": {
    totalSpots: 2,
    availableSpots: 2,
    location: { lat: 9.1484, lng: 77.8322 }, // National Engineering College Car Parking
  },
  "lot-002": {
    totalSpots: 6,
    availableSpots: 3,
    location: { lat: 8.7305, lng: 77.7123 }, // Aravind Eye Hospital Car Parking
  },
  "lot-003": {
    totalSpots: 12,
    availableSpots: 7,
    location: { lat: 8.8029, lng: 78.1448 }, // Velavan Hyper Market (Tuticorin)
  },
};

app.post('/api/parking/update', (req, res) => {
  const { parkingLotId, spot1, spot2 } = req.body;
  if (!parkingLots[parkingLotId]) {
    return res.status(404).json({ error: 'Parking lot not found' });
  }
  const parkingLot = parkingLots[parkingLotId];
  parkingLot.availableSpots = parkingLot.totalSpots - (spot1 ? 1 : 0) - (spot2 ? 1 : 0);

  console.log(`Parking lot ${parkingLotId}: ${parkingLot.availableSpots} spots available`);
  res.sendStatus(200);
});

app.get('/api/parking', (req, res) => {
  res.json(parkingLots);
});

// Use environment variable for port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
