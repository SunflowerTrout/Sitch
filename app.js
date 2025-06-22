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

// Create a custom icon
const customIcon = L.divIcon({
  className: 'custom-marker',
  iconSize: [20, 20],
});

// Handle map clicks to add a Sitch
map.on('click', function(e) {
  const message = prompt("What's happening here?");
  if (message) {
    const marker = L.marker(e.latlng, { icon: customIcon }).addTo(map)
      .bindPopup(message)
      .openPopup();
    sitches.push({ latlng: e.latlng, message });
  }
});

// Update: Handle form submission to add marker at map center AND keep the list
document.getElementById('dropForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('dropInput');
  const text = input.value.trim();
  if (text) {
    // Get the current center of the map
    const center = map.getCenter();
    // Add marker to the map
    const marker = L.marker(center, { icon: customIcon }).addTo(map)
      .bindPopup(text)
      .openPopup();
    sitches.push({ latlng: center, message: text });

    // --- Timestamp Creation ---
    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0) as 12
    
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const timestamp = `[${month} ${day}, ${year} · ${hours}:${minutes} ${ampm}]`;
    // --- End Timestamp Creation ---

    // Add to the list below with the timestamp
    const li = document.createElement('li');
    li.textContent = `${text} ${timestamp}`;
    document.getElementById('dropList').appendChild(li);

    input.value = '';
  }
});
