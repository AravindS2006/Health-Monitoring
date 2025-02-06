// Additions to script.js

// Clock Function
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString();
    document.getElementById('clock').textContent = time;
}
setInterval(updateClock, 1000); // Update every second
updateClock(); // Initialize clock

// Data Card Entrance Animation
const dataCardsSection = document.querySelector('.data-cards-section');
window.addEventListener('load', () => {
  dataCardsSection.classList.add('loaded');
});

//Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  //You would ideally save the theme to local storage
});

//Alerts
const alertsList = document.getElementById('alerts-list');

function addAlert(message) {
  const li = document.createElement('li');
  li.textContent = message;
  alertsList.appendChild(li);
}

// Mock thresholds for demonstration
const HEART_RATE_THRESHOLD = 100;
const SPO2_THRESHOLD = 95;

socket.on('sensorData', (data) => {
  heartRateElement.textContent = data.heartRate + ' BPM';
  spo2Element.textContent = data.spo2 + ' %';
  temperatureElement.textContent = data.temperature + ' °C';

  updateChart(heartRateChart, data.heartRate);
  updateChart(spo2Chart, data.spo2);
  updateChart(temperatureChart, data.temperature);

  heartRateElement.classList.add('data-updated');
  spo2Element.classList.add('data-updated');
  temperatureElement.classList.add('data-updated');

  setTimeout(() => {
      heartRateElement.classList.remove('data-updated');
      spo2Element.classList.remove('data-updated');
  }, 500);

  //Check thresholds
  if (data.heartRate > HEART_RATE_THRESHOLD) {
    addAlert(`High Heart Rate: ${data.heartRate} BPM!`);
  }

  if (data.spo2 < SPO2_THRESHOLD) {
    addAlert(`Low SpO2: ${data.spo2}%!`);
  }
});