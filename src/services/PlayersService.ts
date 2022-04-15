import { ref, Ref } from 'vue'

export interface Player {
   id: string,
   name: string,
   victory: number;
}

export interface PlayersService {
   addPlayer:(newPlayer: Player) => Promise<Player>;
   retrievePlayers: () => Promise<Player[]>;
}

const BACK_URL = "" ;

export default function usePlayersService() {

   async function addPlayer(newPlayer: Player) {
      const response = await fetch(BACK_URL + "/api/players/create", {
         method: "POST",
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(newPlayer)
      });
      const createdPlayer = await response.json();
      return Promise.resolve(createdPlayer);
   }

   function removePlayer(id: string) {
   }

   async function retrievePlayers(){
      const response = await fetch(BACK_URL + "/api/players");
      const savedPlayers = await response.json();
      return Promise.resolve(savedPlayers);
   }

   return {
      addPlayer,
      removePlayer,
      retrievePlayers
   }
}
