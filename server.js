const PORT = process.env.PORT || 3000;
const path = require('path');
const express = require('express');
const {Server} = require("socket.io");
const server = express()
    .use(express.static(__dirname + '/dist'))
    .use((req, res) => res.sendFile(path.join(__dirname + '/dist/index.html')))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


const colors = {topColorHex: getRandomColor(), bottomColorHex: getRandomColor()};

// Start the app by listening on the default Heroku port

const jaugeWarState = {topColor: 250, bottomColor: 250, colors: colors};
let playersCount = 0;

io.on('connection', (socket) => {
    console.log('a user connected');
    playersCount++;
    io.emit("players-count", playersCount);
    io.emit('jauge-war-state', jaugeWarState);
    socket.on('disconnect', () => {
        playersCount--;
        io.emit("players-count", playersCount);
        console.log('user disconnected');
    });

    socket.on('jauge-action', (msg) => {
        if (msg.indexOf('top-color') !== -1 && jaugeWarState.topColor < 500) {
            jaugeWarState.topColor++;
            jaugeWarState.bottomColor--;
        }
        if (msg.indexOf('bottom-color') !== -1 && jaugeWarState.bottomColor < 500) {
            jaugeWarState.bottomColor++;
            jaugeWarState.topColor--;
        }
        io.emit('jauge-war-state', jaugeWarState);
    });

    socket.on('change-color', () => {
        jaugeWarState.colors = {topColorHex: getRandomColor(), bottomColorHex: getRandomColor()};
        io.emit('jauge-war-state', jaugeWarState);
    })

})
