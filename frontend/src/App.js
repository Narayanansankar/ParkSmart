import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import './App.css'; 


const availableIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const fullIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


function App() {
  const [parkingLots, setParkingLots] = useState({});
  const [selectedLot, setSelectedLot] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const mapRef = useRef();

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://192.168.137.139:3000/api/parking');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setParkingLots(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // 

   
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval); 
  }, []);

  
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude]);
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);

  
  useEffect(() => {
    if (selectedLot && userLocation && mapRef.current) {
      const map = mapRef.current;

  
      if (route) {
        map.removeControl(route);
      }

  
      const newRoute = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng), // User location
          L.latLng(selectedLot.location.lat, selectedLot.location.lng), // Parking lot location
        ],
        routeWhileDragging: true,
        show: false, // Hide the default routing instructions
      }).addTo(map);

      setRoute(newRoute);
    }
  }, [selectedLot, userLocation]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>Park Smart</h1>
        <p>Find available parking spots in real-time</p>
      </header>

      {/* Map Container */}
      <div className="map-container">
        <MapContainer
          center={[8.7289, 77.7087]} // Default center (Pothys Car Parking)
          zoom={14} // Default zoom level
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
        >
          {/* Add OpenStreetMap tile layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Display user location */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Tooltip>Your Location</Tooltip>
            </Marker>
          )}

          {/* Display markers for each parking lot */}
          {Object.keys(parkingLots).map((lotId) => {
            const lot = parkingLots[lotId];
            const isFull = lot.availableSpots === 0; // Check if parking lot is full
            return (
              <Marker
                key={lotId}
                position={[lot.location.lat, lot.location.lng]}
                icon={isFull ? fullIcon : availableIcon} // Use red icon if full, green otherwise
                eventHandlers={{
                  click: () => setSelectedLot(lot),
                }}
              >
                {/* Tooltip for hover */}
                <Tooltip>
                  <div className="tooltip">
                    <h4>Parking Lot</h4>
                    <p>Available Spots: {lot.availableSpots}</p>
                    <p>Total Spots: {lot.totalSpots}</p>
                  </div>
                </Tooltip>

                {/* Popup for click */}
                {selectedLot && selectedLot === lot && (
                  <Popup>
                    <div className="popup">
                      <h3>Parking Lot</h3>
                      <p>Available Spots: {selectedLot.availableSpots}</p>
                      <p>Total Spots: {selectedLot.totalSpots}</p>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;