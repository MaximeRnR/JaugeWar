
module.exports = {
   databaseService: () => {
      return {
         addVictoryPointTo: () => {
            console.log("not impletemented")
         },
         saveGameServer: () => {
            console.log("not impletemented")
         },
         getGamesServers: () => {
            console.log("not impletemented")
            return [];
         },
         getGlobalPlayers: () => {
            console.log("not impletemented");
            return new Map();
         },
         playerExist: () => {
            console.log("not impletemented")
            return false;
         },
         registerPlayer: () => {
            console.log("not impletemented")
         }
      }
   },
   gameService: (databaseService) => {
      return {
         startGameOn: (io) => {
            console.log("not impletemented")
         }
      }
   }
}
