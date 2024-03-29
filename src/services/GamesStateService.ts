import { ref, Ref } from 'vue'
import {Player} from './PlayersService';

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
      const response = await fetch("/api/games");
      const savedGames = await response.json();
      return Promise.resolve(savedGames);
   }

   return {
      addGame,
      removeGame,
      retrieveGames
   }
}
