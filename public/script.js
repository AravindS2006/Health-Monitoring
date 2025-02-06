// Function to update the clock
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString();
    document.getElementById('clock').textContent = time;
}
setInterval(updateClock, 1000);
updateClock();

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light-theme'; // Default to light theme
document.documentElement.className = savedTheme; // Set initial theme

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.className;
    const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
});

// Chart Data
let heartRateData = [];
let spo2Data = [];
let temperatureData = [];
const MAX_DATA_POINTS = 50; // Limit data points for scrolling effect

// Global variable for the scrolling chart
let scrollingChart;

// Function to create chart
function createChart(canvasId, label, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Use labels for timestamps if needed
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: false // Hide x-axis labels
                },
                y: {
                    beginAtZero: true
                }
            },
            animation: false // Disable animation for scrolling effect
        }
    });
}

// Initialize the chart after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    scrollingChart = createChart('scrollingChart', 'Sensor Readings', 'rgba(75, 192, 192, 1)');
});

// Function to update radial progress
function updateRadialProgress(selector, value, maxValue) {
    const progress = document.querySelector(selector);
    const percentageElement = progress.querySelector('.percentage');
    const fillElement = progress.querySelector('.circle .fill');
    const maskFullElement = progress.querySelector('.circle .mask.full');

    const percentage = Math.max(0, Math.min((value / maxValue) * 100, 100));
    const rotation = Math.min(percentage * 3.6, 180); // 100% = 360deg, but we split it

    percentageElement.textContent = Math.round(percentage) + '%';

    fillElement.style.transform = `rotate(${rotation}deg)`;

    if (percentage > 50) {
        maskFullElement.classList.add('active');
    } else {
        maskFullElement.classList.remove('active');
    }
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

    // Update scrolling chart data
    heartRateData.push(data.heartRate);
    spo2Data.push(data.spo2);
    temperatureData.push(data.temperature);

    // Limit data points for scrolling effect
    if (heartRateData.length > MAX_DATA_POINTS) {
        heartRateData.shift();
        spo2Data.shift();
        temperatureData.shift();
    }

    // Update chart labels (using timestamps if needed)
    const timestamp = new Date().toLocaleTimeString();
    scrollingChart.data.labels.push(timestamp);
    if (scrollingChart.data.labels.length > MAX_DATA_POINTS) {
        scrollingChart.data.labels.shift();
    }

    // Update chart datasets
    scrollingChart.data.datasets = [
        {
            label: 'Heart Rate (BPM)',
            data: heartRateData,
            borderColor: 'rgba(255, 99, 132, 1)',
            fill: false
        },
        {
            label: 'SpO2 (%)',
            data: spo2Data,
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: false
        },
        {
            label: 'Temperature (°C)',
            data: temperatureData,
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false
        }
    ];

    scrollingChart.update();

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
    const headers = Object.keys(data[0]); // Assuming all objects have the same keys

    csvRows.push(headers.join(',')); // Add header row

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