// Function to update the clock
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString();
    document.getElementById('clock').textContent = time;
}
setInterval(updateClock, 1000);

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.documentElement.className = savedTheme;

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.className;
    const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
});

// Data arrays for sparklines and centralized chart
let heartRateData = [];
let spo2Data = [];
let temperatureData = [];
const MAX_DATA_POINTS = 50;

// Initialize Chart.js for time series chart
let timeSeriesChart;

// Initialize the chart after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Heart Rate (BPM)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    data: [],
                    fill: false
                },
                {
                    label: 'SpO2 (%)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    data: [],
                    fill: false
                },
                {
                    label: 'Temperature (°C)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    data: [],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
});

// Function to update radial progress
function updateRadialProgress(selector, value, maxValue) {
    const progress = document.querySelector(selector);
    const percentageElement = progress.querySelector('.percentage');
    const fillElement = progress.querySelector('.circle .fill');
    const maskFullElement = progress.querySelector('.circle .mask.full');

    const percentage = Math.max(0, Math.min((value / maxValue) * 100, 100));
    const rotation = Math.min(percentage * 3.6, 180);

    percentageElement.textContent = Math.round(percentage) + '%';
    fillElement.style.transform = `rotate(${rotation}deg)`;

    if (percentage > 50) {
        maskFullElement.classList.add('active');
    } else {
        maskFullElement.classList.remove('active');
    }
}

// Function to update sparklines
function updateSparkline(elementId, data) {
    const element = document.getElementById(elementId);
    element.innerHTML = ''; // Clear previous content
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${data.length} 100`);
    svg.setAttribute('preserveAspectRatio', 'none');

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let d = `M0 ${100 - data[0]} `;

    for (let i = 1; i < data.length; i++) {
        d += `L${i} ${100 - data[i]} `;
    }

    path.setAttribute('d', d);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', 1);
    svg.appendChild(path);
    element.appendChild(svg);
}

// Function to add new data point and limit array length
function addDataPoint(dataArray, newDataPoint) {
    dataArray.push(newDataPoint);
    if (dataArray.length > MAX_DATA_POINTS) {
        dataArray.shift();
    }
}

// Function to update the central chart
function updateCentralChart(heartRate, spo2, temperature) {
  if (!timeSeriesChart) return;

  const now = new Date();
  const time = now.toLocaleTimeString();

  // Push new data
  addDataPoint(heartRateData, heartRate);
  addDataPoint(spo2Data, spo2);
  addDataPoint(temperatureData, temperature);

  // Update labels and data for the chart
  timeSeriesChart.data.labels.push(time);
  if (timeSeriesChart.data.labels.length > MAX_DATA_POINTS) {
      timeSeriesChart.data.labels.shift();
  }

  timeSeriesChart.data.datasets[0].data = [...heartRateData]; // Heart Rate
  timeSeriesChart.data.datasets[1].data = [...spo2Data]; // SpO2
  timeSeriesChart.data.datasets[2].data = [...temperatureData]; // Temperature

  // Limit data points
  timeSeriesChart.data.datasets.forEach((dataset) => {
      if (dataset.data.length > MAX_DATA_POINTS) {
          dataset.data.shift();
      }
  });

  timeSeriesChart.update();
}

//Alert Thresholds
let heartRateThreshold = localStorage.getItem('heartRateThreshold') || 100;
let spo2Threshold = localStorage.getItem('spo2Threshold') || 95;

document.getElementById('heartRateThreshold').value = heartRateThreshold;
document.getElementById('spo2Threshold').value = spo2Threshold;

//Apply Thresholds
document.getElementById('applyInterval').addEventListener('click', () => {
  const newInterval = parseInt(document.getElementById('interval').value);
  if (newInterval >= 100) {
      console.log(`Interval updated to ${newInterval}ms`);

      //Visual feedback to the user.
      document.getElementById('applyInterval').textContent = "Applied!";
      setTimeout(() => {
          document.getElementById('applyInterval').textContent = "Apply";
      }, 1000);

    } else {
        alert('Interval must be at least 100ms.');
    }
});

// Load thresholds from localStorage
const dataCardsSection = document.querySelector('.data-cards-section');
window.addEventListener('load', () => {
  dataCardsSection.classList.add('loaded');
});

const heartRateThresholdInput = document.getElementById('heartRateThreshold');
const spo2ThresholdInput = document.getElementById('spo2Threshold');

heartRateThresholdInput.addEventListener('change', function() {
  heartRateThreshold = this.value;
  localStorage.setItem('heartRateThreshold', heartRateThreshold);
});

spo2ThresholdInput.addEventListener('change', function() {
  spo2Threshold = this.value;
  localStorage.setItem('spo2Threshold', spo2Threshold);
});

// Function to add alert
const alertsList = document.getElementById('alerts-list');

function addAlert(message, type) {
    const li = document.createElement('li');
    li.textContent = message;
    li.classList.add(type); // Add class 'high' or 'low' for styling
    alertsList.appendChild(li);
}

function clearAlerts() {
    alertsList.innerHTML = '';
}

//Add alerts
document.getElementById('clearAlerts').addEventListener('click', () => {
  clearAlerts();
});

//Data Export
document.getElementById('exportData').addEventListener('click', () => {
  downloadCSV(sensorDataHistory);
});

//Global array to store sensor data
const sensorDataHistory = [];

//Socket
const socket = io();

// Socket event listener for receiving sensor data
socket.on('sensorData', (data) => {
  // Update HTML elements with sensor data
  document.getElementById('heartRate').textContent = data.heartRate + ' BPM';
  document.getElementById('spo2').textContent = data.spo2 + ' %';
  document.getElementById('temperature').textContent = data.temperature + ' °C';

  // Update radial progress indicators
  updateRadialProgress('.heart-rate-progress', data.heartRate, 180);
  updateRadialProgress('.spo2-progress', data.spo2, 100);
  updateRadialProgress('.temperature-progress', data.temperature, 45);

  //Push data to the centralized chart
  updateCentralChart(data.heartRate, data.spo2, data.temperature);

  // Add data points to the data arrays
  addDataPoint(heartRateData, data.heartRate);
  addDataPoint(spo2Data, data.spo2);
  addDataPoint(temperatureData, data.temperature);

  // Update sparklines
  updateSparkline('heartRateSparkline', heartRateData);
  updateSparkline('spo2Sparkline', spo2Data);
  updateSparkline('temperatureSparkline', temperatureData);

  //Check thresholds
  if (data.heartRate > heartRateThreshold) {
      addAlert(`High Heart Rate: ${data.heartRate} BPM!`, 'high');
  }

  if (data.spo2 < spo2Threshold) {
      addAlert(`Low SpO2: ${data.spo2}%!`, 'low');
  }

  //Store sensor data
  sensorDataHistory.push(data);
});

//downloadCSV (data exporter):
function downloadCSV(data) {
    const csvRows = [];
    const headers = Object.keys(data[0]);

    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => row[header]);
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'sensor_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up
}