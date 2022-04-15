const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const server = http.createServer(app);
const path = require('path');

const {Server} = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const jaugeWarState = {topColor: 250, bottomColor: 250};


app.use(express.static(__dirname + '/dist'));
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/dist/index.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');
    io.emit('jauge-war-state', jaugeWarState);
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('jauge-action', (msg) => {
        if (msg.indexOf('top-color') !== -1) {
            jaugeWarState.topColor++;
            jaugeWarState.bottomColor--;
        } else {
            jaugeWarState.bottomColor++;
            jaugeWarState.topColor--;
        }
        io.emit('jauge-war-state', jaugeWarState);
    });
})

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 3000);