<script setup lang="ts">

import {io} from "socket.io-client";
import {onMounted, reactive, ref} from "vue";

const HOST = location.origin.replace(/^http/, 'ws')
const canvas = ref(null);
const changeColorBtn = ref(null);
const onlinePlayerCount = ref(0);
const onlinePlayersRef = ref(new Array<{user:string, clics: number}>());
const userClicks = ref(0);
const inputUserName = ref(null);
const goButton = ref(null);
let topColor = ref("#25A851");
let bottomColor = ref("#A8201D");
let username = ref(null);


let ctx: CanvasRenderingContext2D | null;
const width = window.innerWidth * 0.8;
const height = 500;

const socket = io(HOST);
socket.on('jauge-war-state', function (jaugeWarState: { state: any, onlinePlayers: {user:string, clics: number}[] }) {
  if (ctx) {
    topColor.value = jaugeWarState.state.colors.topColorHex;
    bottomColor.value = jaugeWarState.state.colors.bottomColorHex;
    ctx!.fillStyle = jaugeWarState.state.colors.topColorHex;
    ctx!.fillRect(0, 0, width, jaugeWarState.state.topColor);
    ctx!.fillStyle = jaugeWarState.state.colors.bottomColorHex;
    ctx!.fillRect(0, 500 - jaugeWarState.state.bottomColor, width, 500);
  }
  userClicks.value = jaugeWarState.onlinePlayers.filter(x => x.user === username.value)[0]?.clics ?? undefined;
  onlinePlayersRef.value = jaugeWarState.onlinePlayers.sort((a,b) => b.clics - a.clics);
});

socket.on('players-count', (playersCount) => {
      onlinePlayerCount.value = playersCount
    }
);

onMounted(() => {
  const canvasElement = canvas.value as unknown as HTMLCanvasElement;
  ctx = canvasElement.getContext("2d");
  canvasElement.width = width;
  canvasElement.height = height;
  if (localStorage.jaugeWarUsername) {
    username.value = localStorage.jaugeWarUsername;
    const goButtonElement = goButton.value as unknown as HTMLButtonElement;
    goButtonElement.remove();
    const inputUserNameElement = inputUserName.value as unknown as HTMLInputElement;
    inputUserNameElement.remove();
    socket.emit('player-username', username.value);
    socket.emit('jauge-action', {action: ``, username: username.value});
  }
});

function increaseColor(color: string) {
  socket.emit('jauge-action', {action: `increase ${color}`, username: username.value});
}

function background(color: string) {
  return `background: ${color}`;
}

function changeColor() {
  socket.emit("change-color", username.value);
  var btnElement = changeColorBtn.value as unknown as HTMLButtonElement;
  btnElement.disabled = true;
  setTimeout(() => btnElement.disabled = false, 60000);
}

function registerUsername() {
  const inputUserNameElement = inputUserName.value as unknown as HTMLInputElement;
  if (!inputUserNameElement.value) {
    return;
  }
  localStorage.jaugeWarUsername = inputUserNameElement.value;
  username.value = localStorage.jaugeWarUsername;
  const goButtonElement = goButton.value as unknown as HTMLButtonElement;
  goButtonElement.remove();
  inputUserNameElement.remove();
  socket.emit('player-username', username.value);
}
</script>

<template>
  <h1 class="title"> Jauge War  </h1>
  <canvas ref="canvas" width="500" height="500"></canvas>
  <div class="btns-container">
    <button class="increase-btn" :style="background(topColor)" @click="increaseColor('top-color')">+1</button>
    <button class="increase-btn" :style="background(bottomColor)" @click="increaseColor('bottom-color')">+1</button>
  </div>
  <div class="meta-info">
    <button ref="changeColorBtn" class="change-color" @click="changeColor()">Change colors</button>
    <div class="user-name-form">
      <input ref="inputUserName" type="text" class="user-name" placeholder="pseudo"/>
      <button ref="goButton" @click="registerUsername()">GO</button>
      <span v-if="username">{{ username }} clicks : {{ userClicks }}</span>
    </div>
    <div class="players-list" v-if="onlinePlayersRef">
      <span>Joueur·euse en ligne: {{ onlinePlayerCount }}</span>
      <span v-for="player in onlinePlayersRef">{{ player.user }} - {{player.clics}}</span>
    </div>
  </div>

</template>

<style scoped>

h1.title {
  display: flex;
  flex-direction: column;
  color: white;
}

.title span {
  font-style: italic;
  font-size: 0.5em;
}

.increase-btn {
  width: 50px;
  height: 30px;
  font-size: 1em;
}

.btns-container {
  margin-top: 12px;
  width: 80%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-direction: row;
}

.btns-container button {
  border-radius: 10px;
  font-size: 2em;
  font-weight: bold;
  cursor: pointer;
  color: white;
  outline: none;
  height: 50px;
  width: 45%;
  border: 2px solid white;
  touch-action: manipulation;
}

.btns-container button:active {
  border: none;
}

canvas {
  border: 1px solid white;
  border-radius: 50px;
}

.meta-info {
  margin-top: 12px;
  width: 80%;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

.change-color {
  width: 30%;
  height: 30px;
  border-radius: 10px;
  border: none;
  font-weight: bold;
}

.user-name-form {
  display: flex;
  width: 30%;
  justify-content: center;
  align-items: flex-start;
}

.user-name-form input {
  border-radius: 10px;
  border: 1px solid white;
  height: 20px;
  padding-left: 15px;

}

.user-name-form button {
  height: 20px;
  margin-left: 12px;
  border-radius: 10px;
  border: 1px solid white;
}

.user-name-form span {
  margin-top: 12px;
  color: white;
  font-weight: bold;
  font-size: 2em;
}

.players-list {
  width: 30%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  max-height: 20vh;
  overflow: auto;
}

.players-list span {
  font-size: 1.5em;
  font-weight: bold;
  color: white;
}


@media (max-width: 480px) {

  .meta-info {
    margin-top: 12px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .meta-info > * {
    margin-top: 12px;
    width: 80%;
  }
}

</style>
