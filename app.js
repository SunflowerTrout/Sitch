// --- Leaflet Map Integration ---

// Initialize the map (default to San Francisco)
const map = L.map('map').setView([37.7749, -122.4194], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Try to center map on user's location
map.locate({ setView: true, maxZoom: 16 });

// Store Sitches in memory
const sitches = [];

// Handle map clicks to add a Sitch
map.on('click', function(e) {
  const message = prompt("What's happening here?");
  if (message) {
    const marker = L.marker(e.latlng).addTo(map)
      .bindPopup(message)
      .openPopup();
    sitches.push({ latlng: e.latlng, message });
  }
});

document.getElementById('dropForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('dropInput');
  const text = input.value.trim();
  if (text) {
    const li = document.createElement('li');
    li.textContent = text + ' - [Send KAS Tip]';
    document.getElementById('dropList').appendChild(li);
    input.value = '';
  }
});
