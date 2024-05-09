import type {Player} from './PlayersService';

export interface Game {
   id: string,
   owner: Player,
   name: string,
}

export interface GameStateService {
   addGame:(newGame: Game) => Promise<Game>;
   removeGame: (id: number) => void;
   retrieveGames: () => Promise<Game[]>;
}

const BACK_URL = "http://localhost:3000"

export default function useGameService() {

   async function addGame(newGame: Game) {
      const response = await fetch(BACK_URL + "/api/games/create", {
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
      const response = await fetch(BACK_URL + "/api/games");
      const savedGames = await response.json();
      return Promise.resolve(savedGames);
   }

   return {
      addGame,
      removeGame,
      retrieveGames
   }
}
