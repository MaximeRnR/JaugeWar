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

const jaugeWarState = {topColor: 250, bottomColor: 250, finished: false, direction: ''};
let playersCount = 0;
const registeredPlayer = new Map();

function registeredPlayersToList() {
    return [...registeredPlayer.entries()].map(x => {
        return {uuid: x[0], username: x[1].username, clicks: x[1].clicks, activeBonuses: x[1].activeBonuses, team: x[1].team, victory: x[1].victory}
    });
}

const COLOR_CHANGED_EVENT = 'color-changed';
const ONLINE_PLAYERS_EVENT = 'online-players';
const PLAYERS_COUNT_EVENT = "players-count";
const JAUGE_WAR_STATE_EVENT = 'jauge-war-state';
const VICTORY_EVENT = 'victory';

const MAX_COLOR_VALUE = 500;

let victoryTime;
let lastClickWinner;
let mostClickWinner;

const bonuses = [
    {id: 0, lineMultiplier: 2, cost: 10, duration: 10000},
    {id: 1, lineMultiplier: 5, cost: 50, duration: 5000}
];


const BOT_ACTIVATION_THRESHOLD = 3;
let botsInterval;
const activeBots = (socket) => {
    clearInterval(botsInterval);
    botsInterval = setInterval(() => {
        if (Math.floor(Math.random() * 2) % 2) {
            jaugeWarState.topColor++;
            jaugeWarState.bottomColor--;
            jaugeWarState.direction = 'down';
        } else {
            jaugeWarState.topColor--;
            jaugeWarState.bottomColor++;
            jaugeWarState.direction = 'up';
        }
        io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);

    }, 300)
};


function checkBotsActivation(socket) {
    if (playersCount > BOT_ACTIVATION_THRESHOLD || jaugeWarState.finished) {
        clearInterval(botsInterval);
    } else {
        activeBots(socket);
    }
}

io.on('connection', (socket) => {
    console.log('a user connected');
    playersCount++;
    checkBotsActivation(socket);
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
            lastClickWinner: lastClickWinner,
            mostClickWinner: mostClickWinner
        });
    }

    socket.on('disconnect', () => {
        playersCount--;
        checkBotsActivation(socket);
        io.emit(PLAYERS_COUNT_EVENT, playersCount);
        console.log('user disconnected');
    });

    socket.on('jauge-action', (action) => {
        if (jaugeWarState.finished) {
            io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList());
            io.emit(COLOR_CHANGED_EVENT, colors);
            return;
        }
        const playerModifier = registeredPlayer.get(action.uuid)?.activeBonuses
            .map(b => b.lineMultiplier)
            .reduce((b1,b2) => b1 * b2, 1) ?? 1;
        if (action.action.indexOf('top-color') !== -1 && jaugeWarState.topColor < MAX_COLOR_VALUE) {
            jaugeWarState.topColor += (1 * playerModifier);
            jaugeWarState.bottomColor -= (1 * playerModifier);
            jaugeWarState.direction = 'down';
            if(registeredPlayer.has(action.uuid)){
                const currentPlayer = registeredPlayer.get(action.uuid);
                if(currentPlayer.team === 'bottom'){
                    currentPlayer.clicks = 0;
                }
                currentPlayer.team = 'top';
                registeredPlayer.set(action.uuid, currentPlayer);
            }
        }
        if (action.action.indexOf('bottom-color') !== -1 && jaugeWarState.bottomColor < MAX_COLOR_VALUE) {
            jaugeWarState.bottomColor += (1 * playerModifier);
            jaugeWarState.topColor -= (1 * playerModifier);
            jaugeWarState.direction = 'up';

            if(registeredPlayer.has(action.uuid)){
                const currentPlayer = registeredPlayer.get(action.uuid);
                if(currentPlayer.team === 'top'){
                    currentPlayer.clicks = 0;
                }
                currentPlayer.team = 'bottom';
                registeredPlayer.set(action.uuid, currentPlayer);
            }
        }
        if (registeredPlayer.has(action.uuid) && (jaugeWarState.topColor < MAX_COLOR_VALUE || jaugeWarState.bottomColor < MAX_COLOR_VALUE)) {
            var updatedPlayer = registeredPlayer.get(action.uuid);
            updatedPlayer.clicks += 1;
            registeredPlayer.set(action.uuid, updatedPlayer);
        }
        if (jaugeWarState.topColor >= MAX_COLOR_VALUE || jaugeWarState.bottomColor >= MAX_COLOR_VALUE) {
            clearInterval(botsInterval);
            victoryTime = new Date();
            const winningTeam =  jaugeWarState.topColor >= MAX_COLOR_VALUE ? 'top' : 'bottom';
            lastClickWinner = registeredPlayer.has(action.uuid) ? registeredPlayer.get(action.uuid) : {username:'Non inscrit·e'};
            lastClickWinner.victory += 1;
            if(lastClickWinner){
                registeredPlayer.set(action.uuid, lastClickWinner);
            }
            const mostClickWinnerUuid = registeredPlayersToList()
               .filter(x => x.team === winningTeam)
               .sort((a, b) => b.clicks - a.clicks)[0]?.uuid;
            mostClickWinner = registeredPlayer.get(mostClickWinnerUuid);
            mostClickWinner.victory += 2;
            if(mostClickWinner){
                registeredPlayer.set(mostClickWinnerUuid, mostClickWinner);
            }
            io.emit(VICTORY_EVENT, {
                winningColor:
                    jaugeWarState
                        .topColor >= MAX_COLOR_VALUE ? colors.topColorHex : colors.bottomColorHex,
                victoryTime: victoryTime,
                lastClickWinner: lastClickWinner,
                mostClickWinner: mostClickWinner
            });
            jaugeWarState.finished = true;
            setTimeout(() => {
                jaugeWarState.topColor = 250;
                jaugeWarState.bottomColor = 250;
                jaugeWarState.finished = false;
                colors.bottomColorHex = getRandomColor();
                colors.topColorHex = getRandomColor();
                registeredPlayer.forEach((v,k) => {
                    v.clicks = 0;
                    v.activeBonuses = [];
                    v.team = null;
                });
                checkBotsActivation(socket);
                io.emit(COLOR_CHANGED_EVENT, colors);
                io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
                io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList());
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
        registeredPlayer.set(ids.uuid, {username: ids.username, clicks: 0, activeBonuses: [], team: null, victory: 0});
        io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
        io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList());
        io.emit(COLOR_CHANGED_EVENT, colors);
    });


    socket.on('bonus-bought', (bonusPayload) => {
        const player = registeredPlayer.get(bonusPayload.uuid);
        const bonus = bonuses.filter(b => b.id === bonusPayload.bonusId)[0];
        if(player && bonus && player.clicks >= bonus.cost && player.activeBonuses.filter(b => b.id === bonusPayload.bonusId).length === 0){
            const lengthOfBonuses = player.activeBonuses.push(bonus);
            player.clicks -= bonus.cost;
            registeredPlayer.set(bonusPayload.uuid, player);
            setTimeout(() => {
                player.activeBonuses.splice(lengthOfBonuses - 1, 1);
                registeredPlayer.set(bonusPayload.uuid, player);
            }, bonus.duration);
            io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList());
        }
    })

})
