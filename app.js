document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed");

  // --- Leaflet Map Integration ---
  const map = L.map('map').setView([37.7749, -122.4194], 13); // Default to San Francisco

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  map.locate({ setView: true, maxZoom: 16 });

  // --- App Logic ---

  const customIcon = L.divIcon({
    className: 'custom-marker',
    iconSize: [20, 20],
  });

  /**
   * Renders a single sitch object to the map and the list.
   * @param {object} sitch - The sitch object from Supabase.
   */
  function renderSitch(sitch) {
    // Add marker to map
    L.marker([sitch.lat, sitch.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(sitch.message);

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
    for (const sitch of data) {
      renderSitch(sitch);
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

  document.getElementById('dropForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('dropInput');
    const text = input.value.trim();
    if (text) {
      await saveSitch(text, map.getCenter());
      input.value = '';
    }
  });

  // Listen for new sitches in real-time
  supa
    .channel('sitches')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sitches' }, (payload) => {
      console.log('New sitch received!', payload.new);
      renderSitch(payload.new);
    })
    .subscribe();

  // Load initial data
  console.log("Loading initial Sitches...");
  loadInitialSitches();

});
