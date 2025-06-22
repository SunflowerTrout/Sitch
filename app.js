document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed");

  // --- Leaflet Map Integration ---
  const map = L.map('map').setView([37.7749, -122.4194], 13); // Default to San Francisco

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  map.locate({ setView: true, maxZoom: 16 });

  // --- App Logic ---
  let latestMarker = null;

  const customIcon = L.divIcon({
    className: 'custom-marker',
    iconSize: [20, 20],
  });

  /**
   * Updates the map to show only the latest sitch marker.
   * Removes the old marker and adds the new one.
   * @param {object} sitch - The sitch object from Supabase.
   */
  function updateMapMarker(sitch) {
    // Remove the previous marker if it exists
    if (latestMarker) {
      map.removeLayer(latestMarker);
    }

    // Create a new marker, add it to the map, and open its popup
    latestMarker = L.marker([sitch.lat, sitch.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(sitch.message)
      .openPopup();
  }

  /**
   * Renders a single sitch object to the list.
   * @param {object} sitch - The sitch object from Supabase.
   */
  function renderSitchToList(sitch) {
    // Create timestamp
    const now = new Date(sitch.created_at);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `[${month} ${day}, ${year} · ${hours}:${minutes} ${ampm}]`;

    // Add to the list below, prepending to show newest first
    const li = document.createElement('li');
    li.textContent = `${sitch.message} ${timestamp}`;
    document.getElementById('dropList').prepend(li);
  }

  /**
   * Loads the initial sitches from the database.
   */
  async function loadInitialSitches() {
    const { data, error } = await supa
      .from('sitches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading sitches:', error);
      return;
    }

    // Clear existing list before loading
    document.getElementById('dropList').innerHTML = '';
    // Iterate over a reversed copy of the data so prepending adds newest items last, resulting in a newest-to-oldest list.
    for (const sitch of [...data].reverse()) {
      renderSitchToList(sitch);
    }
    
    // Add a marker for the newest sitch (the original data array is unchanged)
    if (data && data.length > 0) {
      updateMapMarker(data[0]);
    }
  }

  /**
   * Saves a new sitch to the database.
   * @param {string} message - The sitch message.
   * @param {object} latlng - The Leaflet lat/lng object.
   */
  async function saveSitch(message, latlng) {
    const { error } = await supa
      .from('sitches')
      .insert([{ message: message, lat: latlng.lat, lng: latlng.lng }]);

    if (error) {
      console.error('Error saving sitch:', error);
    }
  }

  // --- Event Handlers & Initial Load ---

  map.on('click', async (e) => {
    const message = prompt("What's happening here?");
    if (message) {
      await saveSitch(message, e.latlng);
    }
  });

  document.getElementById('dropForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const dropInput = document.getElementById('dropInput');
    const submitButton = e.target.querySelector('button');
    const message = dropInput.value.trim();

    if (!message) {
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Getting Location...';

    // We call locate() to get a fresh location, and use .once() to handle the result
    map.locate();

    map.once('locationfound', async (locEvent) => {
      await saveSitch(message, locEvent.latlng);
      dropInput.value = '';
      submitButton.disabled = false;
      submitButton.textContent = 'Send it!';
    });

    map.once('locationerror', (err) => {
      alert("Could not get your location. Please enable location services or click on the map to place your Sitch.");
      submitButton.disabled = false;
      submitButton.textContent = 'Send it!';
      console.error("Location error:", err.message);
    });
  });

  // Listen for new sitches in real-time
  supa
    .channel('sitches')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sitches' }, (payload) => {
      console.log('New sitch received!', payload.new);
      renderSitchToList(payload.new);
      updateMapMarker(payload.new);
    })
    .subscribe();

  // Load initial data
  loadInitialSitches();

});
