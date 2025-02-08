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
const MAX_DATA_POINTS = 10;

// Initialize Chart.js for time series chart
let timeSeriesChart;

// Function to create chart
function createChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Heart Rate (BPM)',
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    data: [],
                },
                {
                    label: 'SpO2 (%)',
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    data: [],
                },
                {
                    label: 'Temperature (°C)',
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    data: [],
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
}

// Initialize the chart after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    timeSeriesChart = createChart('timeSeriesChart');
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

// Function to update the central chart (Bar Chart)
function updateCentralChart(heartRate, spo2, dht12_temp) {
    if (!timeSeriesChart) return;

    const now = new Date();
    const time = now.toLocaleTimeString();

    // Add new data points to the arrays
    heartRateData.push(heartRate);
    spo2Data.push(spo2);
    temperatureData.push(dht12_temp);

    // Limit data points for better visualization
    if (heartRateData.length > MAX_DATA_POINTS) {
        heartRateData.shift();
        spo2Data.shift();
        temperatureData.shift();
    }

    // Update the chart labels (timestamps)
    if (timeSeriesChart.data.labels.length > MAX_DATA_POINTS) {
        timeSeriesChart.data.labels.shift(); // Remove oldest label
    }
    timeSeriesChart.data.labels.push(time); // Add new timestamp

    // Update the chart datasets
    timeSeriesChart.data.datasets[0].data = [...heartRateData]; // Heart Rate
    timeSeriesChart.data.datasets[1].data = [...spo2Data]; // SpO2
    timeSeriesChart.data.datasets[2].data = [...temperatureData]; // Temperature

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
  localStorage.setItem('spo2Threshold', heartRateThreshold);
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

//Function to get random Number:
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Tell the DOM
function updateDisplay() {
   // Generate random values within specified ranges
    const heartRate = getRandomNumber(70, 90);
    const spo2 = getRandomNumber(95, 100);
    const dht12_temp = getRandomNumber(35, 37);

    // Update HTML elements with generated values
    document.getElementById('heartRate').textContent = `${heartRate} BPM`;
    document.getElementById('spo2').textContent = `${spo2} %`;
    document.getElementById('temperature').textContent = `${dht12_temp} °C`;

    //Push data to the centralized chart
    updateCentralChart(heartRate, spo2, dht12_temp);

    // Add data points to the data arrays
    addDataPoint(heartRateData, heartRate);
    addDataPoint(spo2Data, spo2);
    addDataPoint(temperatureData, dht12_temp);

    // Update sparklines
    updateSparkline('heartRateSparkline', heartRateData);
    updateSparkline('spo2Sparkline', spo2Data);
    updateSparkline('temperatureSparkline', temperatureData);

    //Check thresholds (using the dummy values!)
    if (heartRate > heartRateThreshold) {
        addAlert(`High Heart Rate: ${heartRate} BPM!`, 'high');
    }

    if (spo2 < spo2Threshold) {
        addAlert(`Low SpO2: ${spo2}%!`, 'low');
    }

    //Store sensor data (Store the dummy values!)
    sensorDataHistory.push({ heartRate, spo2, dht12_temp });
}

//Initial display
updateDisplay();

//Setup Interval
setInterval(updateDisplay, 2000);

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

//Socket
const socket = io();

//Override socket

//Removing what is not needed
socket.on("connect", () => {
  console.log(`connect ${socket.id}`);
});

//Removing what is not needed
socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

//Override socket
socket.on('sensorData', (data) => {
  //Do nothing.
});