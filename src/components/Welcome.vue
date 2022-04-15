<script setup lang="ts">

import {inject, onMounted, ref} from 'vue';
import {Game, GameStateService} from '../services/GamesStateService';
import {v4} from 'uuid';
import {useRouter} from 'vue-router';
import {Player, PlayersService} from '../services/PlayersService';
import jauge from '../assets/jauge.svg';

const gameStateService: GameStateService | undefined = inject('gameStateService');
const playersService: PlayersService | undefined = inject('playersService');
const inputUserName = ref('')
let userUUID: string;
const loggedIn = ref(false)
const roomName = ref('')
const router = useRouter();
const games = ref<Game[]>([]);
const players = ref<Player[]>([]);
let loggedPlayer = ref<Player | null>();

function registerUsername() {
  if (!inputUserName.value) {
    return;
  }
  localStorage.jaugeWarUsername = inputUserName.value;
  localStorage.jaugeWarUUID = v4();
  loggedIn.value = true;
  loggedPlayer.value = {id: userUUID, name: inputUserName.value, victory: 0};
}

function createGame() {
  if(!roomName?.value){
    return;
  }
  if(!loggedPlayer?.value){
    return;
  }
  if(games.value.find(game => game.owner.id === loggedPlayer.value?.id)){
    return;
  }
  gameStateService?.addGame({id: "", name: roomName.value, owner: loggedPlayer.value }).then(createdGame => {
    router.push('/game/'+createdGame.id)
  })
}

function joinGame(gameId: string) {
  router.push('/game/'+gameId)
}

function sortByVictory(players: any[]) {
  const copyPlayers = [...players];
  return copyPlayers.sort((a, b) => b.victory - a.victory);
}

onMounted(() => {
  if(localStorage.jaugeWarUUID && localStorage.jaugeWarUsername){
    loggedPlayer.value = {id: localStorage.jaugeWarUUID, name: localStorage.jaugeWarUsername, victory: 0}
    loggedIn.value = true;
  }
  gameStateService?.retrieveGames().then(retrievedGames => {
    games.value = retrievedGames;
  }).catch(err => console.log(err));

  playersService?.retrievePlayers().then(retrievedPlayers => {
    players.value = retrievedPlayers;
    if(loggedPlayer.value){
      loggedPlayer.value.victory = retrievedPlayers.find(player => player.id === loggedPlayer.value?.id)?.victory ?? 0;
    }
  }).catch(err => console.log(err));
})

</script>
<template>
  <div class="p-[8px] relative flex flex-col text-white gap-[12px] items-center w-[25%] sm:w-full bg-black/25 rounded-lg p-[8px]">
    <div  v-if="!loggedIn" class="w-full flex flex-col gap-[4px]">
      <label class="text-2xl font-bold" for="username">Pseudo:</label>
      <input v-model="inputUserName" type="text" id="username" class="rounded-lg flex p-[8px] text-black">
      <button class="flex justify-center items-center border border-solid border-white border-[4px] p-[4px] text-lg font-semibold rounded-lg" v-on:click="registerUsername()">Connexion</button>
    </div>
    <div v-if="loggedIn" class="w-full flex flex-col gap-[12px]">
      <div class="flex justify-between items-center gap-[2px]">
        <span class="text-base font-medium">Connecté en tant que:</span>
        <span class="text-lg font-semibold" v-if="loggedIn && loggedPlayer" v-on:keyup.enter="registerUsername()">{{ loggedPlayer.name }}</span>
      </div>
      <div class="flex flex-col gap-[8px]">
        <h2 class="text-2xl font-bold">Créer une partie privée:</h2>
        <div class="w-full flex flex-row justify-between items-center gap-[4px]">
            <input v-model="roomName" type="text" id="roomName" v-on:keyup.enter="createGame()" class="w-[70%] rounded-lg flex p-[8px] text-black" placeholder="Nom de la partie">
          <button class="w-[20%] flex justify-center items-center border border-solid border-white border-[4px] p-[4px] text-lg font-semibold rounded-lg" v-on:click="createGame()">Créer</button>
        </div>
      </div>
      <div class="flex flex-col gap-[8px]">
        <h2 class="text-2xl font-bold">Rejoindre une partie privée:</h2>
        <span v-if="games.length < 1" class="text-lg font-semibold"> Aucune partie disponible, Créer la votre !</span>
        <div v-for="game in games" class="flex justify-between items-center p-[8px] bg-white/50 rounded-lg max-h-[20vh] overflow-auto">
          <span class="text-lg font-bold">{{ game.name }}</span>
          <span class="text-lg font-bold">{{ game.owner.name }}</span>
          <button class="text-lg font-semibold flex justify-center items-center border border-solid border-white border-[4px] p-[4px] text-lg font-semibold rounded-lg" v-on:click="joinGame(game.id)"> Rejoindre </button></div>
      </div>
    </div>
    <div class="w-full flex flex-col gap-[8px]" v-if="players">
      <div class="text-2xl font-bold">Leaderboard</div>
      <div class="flex flex-col gap-[4px] p-[4px] max-h-[50vh] overflow-auto" >
        <span v-for="player in sortByVictory(players)" class="w-full text-white flex flex-row p-[4px] justify-between ">
          <span class="text-lg font-semibold">{{ player.username }}</span>
          <span class="w-[60px] flex flex-row gap-[4px]">
            <span class="text-lg font-semibold">{{ player.victory }}</span>
            <img  :src="jauge" class="flex items-center justify-center h-[35px]" alt="victory_icon"/>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<style>
</style>
