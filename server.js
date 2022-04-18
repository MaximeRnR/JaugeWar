const PORT = process.env.PORT || 3000;
const path = require('path');
const uuid = require('uuid');
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

const jaugeWarState = {topColor: 250, bottomColor: 250, finished: false};
let playersCount = 0;
const registeredPlayer = new Map();

function registeredPlayersToList() {
    return [...registeredPlayer.entries()].map(x => {
        return {uuid: x[0], user: x[1].username, clicks: x[1].clicks}
    });
}

const COLOR_CHANGED_EVENT = 'color-changed';
const ONLINE_PLAYERS_EVENT = 'online-players';
const PLAYERS_COUNT_EVENT = "players-count";
const JAUGE_WAR_STATE_EVENT = 'jauge-war-state';
const VICTORY_EVENT = 'victory';

const MAX_COLOR_VALUE = 500;


let victoryTime;
let previousWinner;


io.on('connection', (socket) => {
    console.log('a user connected');
    playersCount++;

    io.emit(COLOR_CHANGED_EVENT, colors);
    io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList() ?? []);
    io.emit(PLAYERS_COUNT_EVENT, playersCount);
    io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
    if (jaugeWarState.finished) {
        io.emit(VICTORY_EVENT, {
            winningColor:
                jaugeWarState
                    .topColor === MAX_COLOR_VALUE ? colors.topColorHex : colors.bottomColorHex,
            victoryTime: victoryTime,
            winner: previousWinner
        });
    }

    socket.on('disconnect', () => {
        playersCount--;
        io.emit(PLAYERS_COUNT_EVENT, playersCount);
        console.log('user disconnected');
    });

    socket.on('jauge-action', (action) => {
        if (jaugeWarState.finished) {
            io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList());
            io.emit(COLOR_CHANGED_EVENT, colors);
            return;
        }
        if (action.action.indexOf('top-color') !== -1 && jaugeWarState.topColor < MAX_COLOR_VALUE) {
            jaugeWarState.topColor++;
            jaugeWarState.bottomColor--;

        }
        if (action.action.indexOf('bottom-color') !== -1 && jaugeWarState.bottomColor < MAX_COLOR_VALUE) {
            jaugeWarState.bottomColor++;
            jaugeWarState.topColor--;
        }
        if (registeredPlayer.has(action.uuid) && (jaugeWarState.topColor < MAX_COLOR_VALUE || jaugeWarState.bottomColor < MAX_COLOR_VALUE)) {
            var updatedPlayer = registeredPlayer.get(action.uuid);
            updatedPlayer.clicks += 1;
            registeredPlayer.set(action.uuid, updatedPlayer);
        }
        if (jaugeWarState.topColor === MAX_COLOR_VALUE || jaugeWarState.bottomColor === MAX_COLOR_VALUE) {
            victoryTime = new Date();
            previousWinner = registeredPlayer.get(action.uuid)?.username ?? 'Non identifié·e';
            io.emit(VICTORY_EVENT, {
                winningColor:
                    jaugeWarState
                        .topColor === MAX_COLOR_VALUE ? colors.topColorHex : colors.bottomColorHex,
                victoryTime: victoryTime,
                winner: previousWinner
            });
            jaugeWarState.finished = true;
            setTimeout(() => {
                jaugeWarState.topColor = 250;
                jaugeWarState.bottomColor = 250;
                jaugeWarState.finished = false;
                colors.bottomColorHex = getRandomColor();
                colors.topColorHex = getRandomColor();
                io.emit(COLOR_CHANGED_EVENT, colors);
                io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
            }, 30000)
        }
        io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
        io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList());
        io.emit(COLOR_CHANGED_EVENT, colors);
    });

    socket.on('change-color', () => {
        if (jaugeWarState.finished) {
            return;
        }
        colors.topColorHex = getRandomColor();
        colors.bottomColorHex = getRandomColor();
        io.emit(COLOR_CHANGED_EVENT, colors);
    });

    socket.on('player-username', (ids) => {
        if (registeredPlayer.has(ids.uuid)) {
            return;
        }
        registeredPlayer.set(ids.uuid, {username: ids.username, clicks: 0});
        io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
        io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList());
        io.emit(COLOR_CHANGED_EVENT, colors);
    })

})
