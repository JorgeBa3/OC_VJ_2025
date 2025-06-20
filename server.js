// server.js
const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar puerto serial
const port = new SerialPort({
  path: 'COM12',
  baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Variables para almacenar datos
let arduinoData = {
  connected: false,
  lastData: null,
  timestamp: null
};

// Eventos del puerto serial
port.on('open', () => {
  console.log('Puerto COM12 abierto');
  arduinoData.connected = true;
  io.emit('arduino-status', { connected: true });
});

port.on('error', (err) => {
  console.error('Error en puerto serial:', err);
  arduinoData.connected = false;
  io.emit('arduino-status', { connected: false, error: err.message });
});

// Leer datos del Arduino
parser.on('data', (data) => {
  const cleanData = data.toString().replace(/\r?\n|\r/g, '');
  console.log('Datos recibidos:', cleanData);
  
  arduinoData.lastData = cleanData;
  arduinoData.timestamp = new Date().toISOString();
  
  // Enviar datos a todos los clientes conectados
  io.emit('arduino-data', {
    data: cleanData,
    timestamp: arduinoData.timestamp
  });
});

// Rutas API REST
app.get('/api/status', (req, res) => {
  res.json(arduinoData);
});

app.post('/api/enviar', (req, res) => {
  const { command } = req.body;
  
  if (!arduinoData.connected) {
    return res.status(400).json({ error: 'Arduino no conectado' });
  }
  
  try {
    port.write(command + '\n');
    res.json({ success: true, message: `Comando "${command}" enviado` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO para comunicación en tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar estado actual al cliente recién conectado
  socket.emit('arduino-status', { connected: arduinoData.connected });
  
  if (arduinoData.lastData) {
    socket.emit('arduino-data', {
      data: arduinoData.lastData,
      timestamp: arduinoData.timestamp
    });
  }
  
  // Manejar comandos desde el cliente
  socket.on('send-command', (command) => {
    if (arduinoData.connected) {
      port.write(command + '\n');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Frontend disponible en http://localhost:${PORT}`);
});