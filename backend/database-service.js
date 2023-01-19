class DataBaseService {
   globalPlayers = new Map();
   gamesServers = [];
   addVictoryPointTo(player, victoryPoints) {
      if (this.globalPlayers.has(player.id)) {
         const victories = this.globalPlayers.get(player.id).victory;
         this.globalPlayers.set(player.id, {...player, victory: victories + victoryPoints});
      }
   }

   saveGameServer(gameServer) {
      this.gamesServers.push(gameServer);
   }

   getGamesServers() {
      return this.gamesServers;
   }

   getGlobalPlayers() {
      return this.globalPlayers
   }

   playerExist(playerId) {
      return this.globalPlayers.has(playerId);
   }

   registerPlayer(player) {
      this.globalPlayers.set(player.id, {id: player.id, username: player.username, victory: 0});
   }
}

const instance = new DataBaseService();

module.exports = {
   databaseService: instance
}
