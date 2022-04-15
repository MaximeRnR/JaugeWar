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


// Start the app by listening on the default Heroku port

const jaugeWarState = {topColor: 250, bottomColor: 250};


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
