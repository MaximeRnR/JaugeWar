
const injector = require("./backend/service-supplier");
injector.databaseServiceSupplier = () => new (require('./backend/in-memory-db/in-memory-database').inMemoryDbService);
injector.gameServiceSupplier = (databaseService) => new (require('./backend/jauge-war-game/jauge-war-game-service').jaugeWarGameService)(databaseService);

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


const {databaseService} = require('./backend/database-service');
const {gameService} = require('./backend/game-service');

const listener = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
const socket = require('socket.io')(listener);

server.post('/api/games/create', function(req, res) {
    const newGame = {id: uuid.v4(), name: req.body.name, owner: req.body.owner };
    const gameSocket = socket.of("/" + newGame.id);
    databaseService.saveGameServer({game: newGame, server: gameSocket})
    gameService.startGameOn(gameSocket);
    res.send(newGame);
});

server.get('/api/games', (req, res)=>{
    res.send(databaseService.getGamesServers().map(gameAndSocket => gameAndSocket.game));
});

server.get('/api/players', (req, res)=>{
    res.send([...databaseService.getGlobalPlayers().entries()].map(x => {
        return {
            uuid: x[0],
            username: x[1].username,
            victory: x[1].victory
        }
    }));
});

