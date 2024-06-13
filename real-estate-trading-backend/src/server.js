const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

const ordersRouter = require('./api/orders');
app.use('/api/orders', ordersRouter);

// WebSocket connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Function to emit order status updates
async function emitOrderStatusUpdate(order) {
    io.emit('orderStatusUpdate', order);
}

module.exports = { server, emitOrderStatusUpdate };

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
