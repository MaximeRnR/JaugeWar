process.on('uncaughtException', function (err) {
    console.log(err);
});

const PORT = process.env.PORT || 3000;
const path = require('path');
const uuid = require('uuid');
const express = require('express');
const bodyParser = require("body-parser");
const server = express()
   .use(express.static(__dirname + '/dist'))
   .use(bodyParser.urlencoded({extended : true}))
   .use(bodyParser.json())
   .get("/", (req, res) => res.sendFile(path.join(__dirname + '/dist/index.html')))
   .get("/game/*", (req, res) => res.sendFile(path.join(__dirname + '/dist/index.html')))

const gamesAndSockets = [];

const listener = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
const socket = require('socket.io')(listener);

server.post('/api/games/create', function(req, res) {
    const newGame = {id: uuid.v4(), name: req.body.name };
    const gameSocket = socket.of("/" + newGame.id);
    gamesAndSockets.push({game: newGame, server: gameSocket});
    enableSocketServer(gameSocket, {topColor: 250, bottomColor: 250, finished: false, direction: ''}, {topColorHex: getRandomColor(), bottomColorHex: getRandomColor()}, 0, new Map());
    res.send(newGame);
});

server.get('/api/games', (req, res)=>{
    res.send(gamesAndSockets.map(gameAndSocket => gameAndSocket.game));
});

server.get('/api/players', (req, res)=>{
    res.send([...globalPlayers.entries()].map(x => {
        return {
            uuid: x[0],
            username: x[1].username,
            victory: x[1].victory
        }
    }));
});

const bonuses = [
    {id: 0, lineMultiplier: 2, cost: 10, duration: 10000},
    {id: 1, lineMultiplier: 5, cost: 50, duration: 5000}
];

const globalPlayers = new Map();

function registeredPlayersToList(registeredPlayer) {
    return [...registeredPlayer.entries()].map(x => {
        return {
            uuid: x[0],
            username: x[1].username,
            clicks: x[1].clicks,
            activeBonuses: x[1].activeBonuses,
            team: x[1].team,
            victory: x[1].victory
        }
    });
}

const COLOR_CHANGED_EVENT = 'color-changed';
const ONLINE_PLAYERS_EVENT = 'online-players';
const PLAYERS_COUNT_EVENT = "players-count";
const JAUGE_WAR_STATE_EVENT = 'jauge-war-state';
const VICTORY_EVENT = 'victory';


const DELAY_BETWEEN_GAMES = 30000;
const MAX_COLOR_VALUE = 500;
let victoryTime;
let lastClickWinner;
let mostClickWinner;

const BOT_ACTIVATION_THRESHOLD = 3;
let botsInterval;
const activeBots = (socket, jaugeWarState) => {
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
        socket.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);

    }, 300)
};

function checkBotsActivation(socket, jaugeWarState, playersCount) {
    if (playersCount > BOT_ACTIVATION_THRESHOLD || jaugeWarState.finished) {
        clearInterval(botsInterval);
    } else {
        activeBots(socket, jaugeWarState);
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function enableSocketServer(io, jaugeWarState, colors, playersCount, registeredPlayers) {
    io.on('connection', (socket) => {
        console.log('a user connected');
        playersCount++;
        checkBotsActivation(socket, jaugeWarState, playersCount);
        io.emit(COLOR_CHANGED_EVENT, colors);
        io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList(registeredPlayers) ?? []);
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
            checkBotsActivation(socket, jaugeWarState, playersCount);
            io.emit(PLAYERS_COUNT_EVENT, playersCount);
            console.log('user disconnected');
        });

        socket.on('jauge-action', (action) => {
            if (jaugeWarState.finished) {
                io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList(registeredPlayers));
                io.emit(COLOR_CHANGED_EVENT, colors);
                return;
            }
            const playerModifier = registeredPlayers.get(action.uuid)?.activeBonuses
               .map(b => b.lineMultiplier)
               .reduce((b1, b2) => b1 * b2, 1) ?? 1;
            if (action.action.indexOf('top-color') !== -1 && jaugeWarState.topColor < MAX_COLOR_VALUE) {
                jaugeWarState.topColor += (1 * playerModifier);
                jaugeWarState.bottomColor -= (1 * playerModifier);
                jaugeWarState.direction = 'down';
                if (registeredPlayers.has(action.uuid)) {
                    const currentPlayer = registeredPlayers.get(action.uuid);
                    if (currentPlayer.team === 'bottom') {
                        currentPlayer.clicks = 0;
                    }
                    currentPlayer.team = 'top';
                    registeredPlayers.set(action.uuid, currentPlayer);
                }
            }
            if (action.action.indexOf('bottom-color') !== -1 && jaugeWarState.bottomColor < MAX_COLOR_VALUE) {
                jaugeWarState.bottomColor += (1 * playerModifier);
                jaugeWarState.topColor -= (1 * playerModifier);
                jaugeWarState.direction = 'up';

                if (registeredPlayers.has(action.uuid)) {
                    const currentPlayer = registeredPlayers.get(action.uuid);
                    if (currentPlayer.team === 'top') {
                        currentPlayer.clicks = 0;
                    }
                    currentPlayer.team = 'bottom';
                    registeredPlayers.set(action.uuid, currentPlayer);
                }
            }
            if (registeredPlayers.has(action.uuid) && (jaugeWarState.topColor < MAX_COLOR_VALUE || jaugeWarState.bottomColor < MAX_COLOR_VALUE)) {
                var updatedPlayer = registeredPlayers.get(action.uuid);
                updatedPlayer.clicks += 1;
                registeredPlayers.set(action.uuid, updatedPlayer);
            }
            if (jaugeWarState.topColor >= MAX_COLOR_VALUE || jaugeWarState.bottomColor >= MAX_COLOR_VALUE) {
                clearInterval(botsInterval);
                victoryTime = new Date();
                const winningTeam = jaugeWarState.topColor >= MAX_COLOR_VALUE ? 'top' : 'bottom';
                lastClickWinner = registeredPlayers.has(action.uuid) ? registeredPlayers.get(action.uuid) : {username: 'Non inscrit·e'};
                lastClickWinner.victory += 1;
                if (lastClickWinner) {
                    registeredPlayers.set(action.uuid, lastClickWinner);
                    globalPlayers.set(action.uuid, lastClickWinner);
                }
                const mostClickWinnerUuid = registeredPlayersToList(registeredPlayers)
                   .filter(x => x.team === winningTeam)
                   .sort((a, b) => b.clicks - a.clicks)[0]?.uuid;
                mostClickWinner = registeredPlayers.get(mostClickWinnerUuid);
                mostClickWinner.victory += 2;
                if (mostClickWinner) {
                    registeredPlayers.set(mostClickWinnerUuid, mostClickWinner);
                    globalPlayers.set(mostClickWinnerUuid, mostClickWinner);
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
                    registeredPlayers.forEach((v, k) => {
                        v.clicks = 0;
                        v.activeBonuses = [];
                        v.team = null;
                    });
                    checkBotsActivation(socket, jaugeWarState);
                    io.emit(COLOR_CHANGED_EVENT, colors);
                    io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
                    io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList(registeredPlayers));
                }, DELAY_BETWEEN_GAMES)
            }
            io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
            io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList(registeredPlayers));
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
            if (registeredPlayers.has(ids.uuid)) {
                return;
            }
            registeredPlayers.set(ids.uuid, {
                username: ids.username,
                clicks: 0,
                activeBonuses: [],
                team: null,
                victory: 0
            });
            io.emit(JAUGE_WAR_STATE_EVENT, jaugeWarState);
            io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList(registeredPlayers));
            io.emit(COLOR_CHANGED_EVENT, colors);

            if(globalPlayers.has(ids.uuid)){
                return;
            }
            globalPlayers.set(ids.uuid,{
                   id: ids.uuid,
                   username: ids.username,
                   victory: 0});

        });


        socket.on('bonus-bought', (bonusPayload) => {
            const player = registeredPlayers.get(bonusPayload.uuid);
            const bonus = bonuses.filter(b => b.id === bonusPayload.bonusId)[0];
            if (player && bonus && player.clicks >= bonus.cost && player.activeBonuses.filter(b => b.id === bonusPayload.bonusId).length === 0) {
                const lengthOfBonuses = player.activeBonuses.push(bonus);
                player.clicks -= bonus.cost;
                registeredPlayers.set(bonusPayload.uuid, player);
                setTimeout(() => {
                    player.activeBonuses.splice(lengthOfBonuses - 1, 1);
                    registeredPlayers.set(bonusPayload.uuid, player);
                }, bonus.duration);
                io.emit(ONLINE_PLAYERS_EVENT, registeredPlayersToList(registeredPlayers));
            }
        });

    })
}
