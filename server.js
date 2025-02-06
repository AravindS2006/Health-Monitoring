const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const portName = 'COM3'; // Replace with your Arduino's serial port
const baudRate = 115200;

const port = new SerialPort({
  path: portName,
  baudRate: baudRate,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Serve static files (HTML, CSS, JavaScript)
app.use(express.static('public')); // Create a 'public' folder for your website files

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Read data from the serial port
parser.on('data', (data) => {
  try {
    const sensorData = JSON.parse(data);
    console.log('Received data:', sensorData);

    // Send the data to all connected clients via WebSocket
    io.emit('sensorData', sensorData);
  } catch (error) {
    console.error('Error parsing JSON data:', error);
  }
});

port.on('error', (err) => {
    console.error('Serial port error:', err);
});

// Start the server
const serverPort = 3000;
server.listen(serverPort, () => {
  console.log(`Server listening on port ${serverPort}`);
});