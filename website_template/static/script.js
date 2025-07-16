let map;
let countryMarkers = {};
let chartInstance;

const countryCoordinates = {
  "Afghanistan": [33.9391, 67.7100],
  "China": [35.8617, 104.1954],
  "Germany": [51.1657, 10.4515],
  "Greece": [39.0742, 21.8243],
  "India": [20.5937, 78.9629],
  "Indonesia": [-0.7893, 113.9213],
  "Iraq": [33.3152, 44.3661],
  "Ireland": [53.4129, -8.2439],
  "Italy": [41.8719, 12.5674],
  "Lebanon": [33.8547, 35.8623],
  "Malaysia": [4.2105, 101.9758],
  "Nepal": [28.3949, 84.1240],
  "Netherlands": [52.1326, 5.2913],
  "New Zealand": [-40.9006, 174.8860],
  "Pakistan": [30.3753, 69.3451],
  "Philippines": [12.8797, 121.7740],
  "South Africa": [-30.5595, 22.9375],
  "South Korea": [35.9078, 127.7669],
  "Sri Lanka": [7.8731, 80.7718],
  "United Kingdom": [55.3781, -3.4360],
  "United States of America": [37.0902, -95.7129],
  "Vietnam": [14.0583, 108.2772]
};

// Function to sets up Leaflet map, place it at the world’s center, and add a marker for each country (from the above array)
// (and also to attribute OpenStreetMap)

function initializeMap() {
  map = L.map('map').setView([20, 0], 1.3);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  for (let country in countryCoordinates) {
    const [lat, lon] = countryCoordinates[country];
    countryMarkers[country] = L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`<b>${country}</b>`);
  }
}


function showCountryOnMap(country) {
  if (countryMarkers[country]) {
    map.setView(countryMarkers[country].getLatLng(), 4);
    countryMarkers[country].openPopup();
  }
}


// A function which updates the information for each country every time a user clicks a new country.

function updateCountryDetails(country) {
  const container = document.getElementById("information-container");
  container.innerHTML = `<h3>${country}</h3><p>Loading details...</p>`;

  const state = document.getElementById("state-select").value;

  fetch(`/get_row_details?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`)
    .then(res => res.json())
    .then(data => {
      if (!data || Object.keys(data).length === 0) {
        container.innerHTML = `<h3>${country}</h3><p>No cultural information available for ${state}.</p>`;
      } else {
        container.innerHTML = `
          <h3>${country}</h3>
          <ul>
            <li><strong>Languages:</strong> ${data.Languages || 'N/A'}</li>
            <li><strong>Religions:</strong> ${data.Religions || 'N/A'}</li>
            <li><strong>Foods:</strong> ${data.Foods || 'N/A'}</li>
            <li><strong>Sports:</strong> ${data.Sports || 'N/A'}</li>
            <li><strong>Festivals:</strong> ${data.Festivals || 'N/A'}</li>
            <li><strong>Clothing:</strong> ${data.Clothing || 'N/A'}</li>
          </ul>
        `;
      }
    })
    .catch(err => {
      console.error("Error loading country info:", err);
      container.innerHTML = `<h3>${country}</h3><p>Error loading data.</p>`;
    });
}


// --------- Chart Functions ---------

function createChart(state, dataByState) {
  const ctx = document.getElementById("migrantChart").getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  const colors = [
    "rgb(1, 24, 48)", "rgb(2, 36, 73)", "rgb(4, 67, 109)",
    "rgb(6, 92, 150)", "rgb(31, 115, 171)", "rgba(36, 127, 187, 0.9)",
    "rgba(36, 127, 187, 0.75)", "rgba(36, 127, 187, 0.5)",
    "rgba(36, 127, 187, 0.3)", "rgba(149, 140, 140, 0.27)"
  ];

  chartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: dataByState[state]?.labels || [],
      datasets: [{
        data: dataByState[state]?.data || [],
        backgroundColor: colors,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const country = dataByState[state].labels[index];
          showCountryOnMap(country);
          updateCountryDetails(country);
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  generateLegend(dataByState[state]?.labels, colors);
}


// --------- Legend Functions ---------

function generateLegend(labels, colors) {
  const legendContainer = document.getElementById("legend");
  legendContainer.innerHTML = "";

  labels.forEach((label, index) => {
    const li = document.createElement("li");
    const colorBox = document.createElement("span");
    colorBox.style.backgroundColor = colors[index];
    li.appendChild(colorBox);
    li.appendChild(document.createTextNode(label));

    li.onclick = () => {
      showCountryOnMap(label);
      updateCountryDetails(label);
    };

    legendContainer.appendChild(li);
  });
}


// --------- Initialise Everything ---------

document.addEventListener("DOMContentLoaded", async () => {
  initializeMap();

  const stateSelect = document.getElementById("state-select");

  try {
    const response = await fetch("/get_chart_data");
    const dataByState = await response.json();

    Object.keys(dataByState).forEach(state => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });

    createChart(stateSelect.value, dataByState);

    stateSelect.addEventListener("change", () => {
      createChart(stateSelect.value, dataByState);
    });

  } catch (err) {
    console.error("Error loading chart data:", err);
  }
});
