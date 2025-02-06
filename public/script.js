const socket = io(); // Connect to the Socket.IO server
const heartRateElement = document.getElementById('heartRate');
const spo2Element = document.getElementById('spo2');
const temperatureElement = document.getElementById('temperature');
const intervalInput = document.getElementById('interval');
const applyIntervalButton = document.getElementById('applyInterval');

//Chart data
const heartRateChartCanvas = document.getElementById('heartRateChart').getContext('2d');
const spo2ChartCanvas = document.getElementById('spo2Chart').getContext('2d');
const temperatureChartCanvas = document.getElementById('temperatureChart').getContext('2d');

let heartRateChart, spo2Chart, temperatureChart;

function createChart(canvas, label, color) {
    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            animation: {
                duration: 800,
                easing: 'easeInOutQuad'
            },
            scales: {
                x: {
                    display: false // Hide x-axis labels
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// Initialize charts
window.onload = () => {
    heartRateChart = createChart(heartRateChartCanvas, 'Heart Rate (BPM)', 'rgba(255, 99, 132, 1)');
    spo2Chart = createChart(spo2ChartCanvas, 'SpO2 (%)', 'rgba(54, 162, 235, 1)');
    temperatureChart = createChart(temperatureChartCanvas, 'Temperature (°C)', 'rgba(75, 192, 192, 1)');
};


function updateChart(chart, newData) {
    chart.data.labels.push(''); // Add a new label (empty for simplicity)
    chart.data.datasets[0].data.push(newData);

    // Keep only the last 20 data points for better visibility
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
}



// Listen for sensor data from the server
socket.on('sensorData', (data) => {
    heartRateElement.textContent = data.heartRate + ' BPM';
    spo2Element.textContent = data.spo2 + ' %';
    temperatureElement.textContent = data.temperature + ' °C';

    updateChart(heartRateChart, data.heartRate);
    updateChart(spo2Chart, data.spo2);
    updateChart(temperatureChart, data.temperature);

    //Add Animations
    heartRateElement.classList.add('data-updated');
    spo2Element.classList.add('data-updated');
    temperatureElement.classList.add('data-updated');

    setTimeout(() => {
        heartRateElement.classList.remove('data-updated');
        spo2Element.classList.remove('data-updated');
        temperatureElement.classList.remove('data-updated');
    }, 500);  //Remove after 0.5 seconds.
});

//Update chart

// Listen for button click
applyIntervalButton.addEventListener('click', () => {
    const newInterval = parseInt(intervalInput.value);
    if (newInterval >= 100) {
      //You could send this to the server and back to the ESP32, but for the basic example we don't
      //socket.emit('updateInterval', newInterval);
      console.log(`Interval updated to ${newInterval}ms`);

      //Visual feedback to the user.
      applyIntervalButton.textContent = "Applied!";
      setTimeout(() => {
          applyIntervalButton.textContent = "Apply";
      }, 1000);

    } else {
        alert('Interval must be at least 100ms.');
    }
});