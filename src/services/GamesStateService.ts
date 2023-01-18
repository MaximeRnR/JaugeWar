import { ref, Ref } from 'vue'

export interface Game {
   id: string,
   name: string,
}

export interface GameStateService {
   addGame:(newGame: Game) => Promise<Game>;
   removeGame: (id: number) => void;
   retrieveGames: () => Promise<Game[]>;
}

export default function useGameService() {

   async function addGame(newGame: Game) {
      const response = await fetch("/api/games/create", {
         method: "POST",
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(newGame)
      });
      const createdGame = await response.json();
      return Promise.resolve(createdGame);
   }

   function removeGame(id: string) {
   }

   async function retrieveGames(){
      console.log("retrieving...")
      const response = await fetch("/api/games");
      const savedGames = await response.json();
      console.log(savedGames);
      return Promise.resolve(savedGames);
   }

   return {
      addGame,
      removeGame,
      retrieveGames
   }
}
