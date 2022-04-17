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

const jaugeWarState = {topColor: 250, bottomColor: 250};
let playersCount = 0;
const registeredPlayer = new Map();
function registeredPlayersToList(){
    return [...registeredPlayer.entries()].map(x => {return {user: x[0], clics: x[1]}});
}

io.on('connection', (socket) => {
    console.log('a user connected');
    playersCount++;

    io.emit('color-changed', colors);
    io.emit('online-players', registeredPlayersToList() ?? []);
    io.emit("players-count", playersCount);
    io.emit('jauge-war-state', jaugeWarState);

    socket.on('disconnect', () => {
        playersCount--;
        io.emit("players-count", playersCount);
        console.log('user disconnected');
    });

    socket.on('jauge-action', (action) => {
        if (action.action.indexOf('top-color') !== -1 && jaugeWarState.topColor < 500) {
            jaugeWarState.topColor++;
            jaugeWarState.bottomColor--;
            if(registeredPlayer.has(action.username)){
                registeredPlayer.set(action.username, registeredPlayer.get(action.username) + 1 );
            }
        }
        if (action.action.indexOf('bottom-color') !== -1 && jaugeWarState.bottomColor < 500) {
            jaugeWarState.bottomColor++;
            jaugeWarState.topColor--;
            if(registeredPlayer.has(action.username)){
                registeredPlayer.set(action.username, registeredPlayer.get(action.username) + 1 );
            }
        }
        io.emit('jauge-war-state', jaugeWarState);
        io.emit('online-players', registeredPlayersToList());
        io.emit('color-changed', colors);
    });

    socket.on('change-color', () => {
        colors.topColorHex = getRandomColor();
        colors.bottomColorHex =  getRandomColor();
        io.emit('color-changed', colors);
    });

    socket.on('player-username', (username) => {
        if(registeredPlayer.has(username)){
          return;
        }
        registeredPlayer.set(username, 0);
        io.emit('jauge-war-state', jaugeWarState);
        io.emit('online-players', registeredPlayersToList());
        io.emit('color-changed', colors);
    })

})
