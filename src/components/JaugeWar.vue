<script setup lang="ts">

import {io} from "socket.io-client";
import {onMounted, ref} from "vue";
import {v4} from "uuid";
import {fromEvent, useObservable} from "@vueuse/rxjs";
import {interval, map, throttle} from "rxjs";

import arrowDown from '../assets/white-down-arrow.png';
import arrowUp from '../assets/white-up-arrow.png';


const HOST = location.origin.replace(/^http/, 'ws')
const canvas = ref(null);
const canvasShadow = ref(null);
const changeColorBtn = ref(null);
const onlinePlayerCount = ref(0);
const onlinePlayersRef = ref(new Array<{ uuid: string, user: string, clicks: number }>());
const userClicks = ref(0);
const inputUserName = ref(null);
const goButton = ref(null);
const top = ref();
const bottom = ref();

let userUUID: string;
let username = ref<string | null>(null);
let topColor = ref("#25A851");
let bottomColor = ref("#A8201D");
let winningColorRef = ref<string>();
let winnerRef = ref<string>();
let timeRemainingRef = ref<number>();
let currentJaugeWarState: { topColor: number, bottomColor: number, finished: boolean, direction: string};

let gameIsFinished = ref<boolean>(false);
let ctx: CanvasRenderingContext2D | null;
const width = window.innerWidth * 0.8;
const height = 500;

const socket = io(HOST);

const COLOR_CHANGED_EVENT = 'color-changed';
const ONLINE_PLAYERS_EVENT = 'online-players';
const PLAYERS_COUNT_EVENT = "players-count";
const JAUGE_WAR_STATE_EVENT = 'jauge-war-state';
const VICTORY_EVENT = 'victory';

const JAUGE_ACTION = 'jauge-action';
const CHANGE_COLOR_ACTION = "change-color";
const PLAYER_USERNAME_ACTION = 'player-username';

const THROTTLE_DELAY = 1;

const bonuses = [
  {id: 0, label: 'Clicks x 2 ', cost: 10, duration: 10000},
  {id: 1, label: 'Clicks x 5', cost: 50, duration: 5000}
];

socket.on(JAUGE_WAR_STATE_EVENT, function (jaugeWarState: { topColor: number, bottomColor: number, finished: boolean, direction: string }) {
  currentJaugeWarState = jaugeWarState;
  gameIsFinished.value = jaugeWarState.finished;
  draw();
  drawArrow(jaugeWarState.direction);
});

socket.on(COLOR_CHANGED_EVENT, function (colors: { topColorHex: string, bottomColorHex: string }) {
  topColor.value = colors.topColorHex;
  bottomColor.value = colors.bottomColorHex;
  draw();
})

socket.on(PLAYERS_COUNT_EVENT, (playersCount) => {
      onlinePlayerCount.value = playersCount
    }
);

socket.on(ONLINE_PLAYERS_EVENT, (onlinePlayersWithClics: { uuid: string, user: string, clicks: number }[]) => {
  userClicks.value = onlinePlayersWithClics?.filter(x => x.uuid === userUUID)[0]?.clicks ?? undefined;
  onlinePlayersRef.value = onlinePlayersWithClics?.sort((a, b) => b.clicks - a.clicks);
})

socket.on(VICTORY_EVENT, (victoryEvent: { winningColor: string, victoryTime: string, winner: string }) => {
  winningColorRef.value = victoryEvent.winningColor;
  winnerRef.value = victoryEvent.winner;
  if (victoryEvent.victoryTime) {
    const newGameStartDate = new Date(Date.parse(victoryEvent.victoryTime));
    newGameStartDate.setSeconds(newGameStartDate.getSeconds() + 30);
    const timeBeforeNewGame = setInterval(() => {
      const now = new Date().getTime();
      const timeRemaining = newGameStartDate.getTime() - now;
      timeRemainingRef.value = Math.floor((timeRemaining % (1000 * 60)) / (1000));
      if (timeRemaining <= 0) {
        clearInterval(timeBeforeNewGame);
      }
    }, 1000)
  }

})

onMounted(() => {
  const canvasElement = canvas.value as unknown as HTMLCanvasElement;
  ctx = canvasElement.getContext("2d");
  canvasElement.width = width;
  canvasElement.height = height;
  const canvasShadowElement = canvasShadow.value as unknown as HTMLElement;
  canvasShadowElement.style.width =  width + 'px';
  canvasShadowElement.style.height = height + 'px';
  canvasShadowElement.style.top = canvasElement.getBoundingClientRect().top + 'px';
  if (localStorage.jaugeWarUUID && localStorage.jaugeWarUsername) {
    username.value = localStorage.jaugeWarUsername;
    userUUID = localStorage.jaugeWarUUID;
    socket.emit(PLAYER_USERNAME_ACTION, {uuid: localStorage.jaugeWarUUID, username: username.value});
    socket.emit(JAUGE_ACTION, {action: ``, username: username.value});
  }
});


function draw() {
  if (currentJaugeWarState && ctx) {
    ctx!.fillStyle = topColor.value
    ctx!.fillRect(0, 0, width, currentJaugeWarState.topColor);
    ctx!.fillStyle = bottomColor.value;
    ctx!.fillRect(0, 500 - currentJaugeWarState.bottomColor, width, 500);
  }
}



function drawArrow(direction: string) {
  const canvasShadowElement = canvasShadow.value as unknown as HTMLCanvasElement;
  const arrowElement = document.createElement('img');
  arrowElement.src = direction === 'down' ? arrowDown : arrowUp;
  arrowElement.classList.add('arrow-element');
  if(direction === 'down'){
    arrowElement.style.top = Math.floor(Math.random() * currentJaugeWarState.topColor) + 'px';
  }
  if(direction === 'up'){
    arrowElement.style.bottom = Math.floor(Math.random() * currentJaugeWarState.bottomColor) + 'px'
  }
  arrowElement.style.left = Math.floor(Math.random() * width) + 'px';
  arrowElement.classList.add('fading-animation');
  canvasShadowElement.append(arrowElement);
  setTimeout(() => {
    arrowElement.remove();
  }, 1000);
}

const topClick = useObservable(
    fromEvent(top, 'click').pipe(
        throttle(() => interval(THROTTLE_DELAY)),
        map(() => {
          socket.emit(JAUGE_ACTION, {action: `increase top-color`, uuid: userUUID});
        })
    )
);

const bottomClick = useObservable(
    fromEvent(bottom, 'click').pipe(
        throttle(() => {
          return interval(THROTTLE_DELAY);
        }),
        map(() => {
          socket.emit(JAUGE_ACTION, {action: `increase bottom-color`, uuid: userUUID});
        })
    )
);

function buyBonus(bonus: any, event: any){
  socket.emit('bonus-bought', {uuid: userUUID, bonusId: bonus.id});
  event.target.style.animation = `buttonBackgroundDecrease ${bonus.duration}ms ease-in`;
  event.target.disabled = true;
  setTimeout(() => {
    event.target.disabled = false;
    event.target.style.animation = `none`;
  }, bonus.duration);
}

function changeColor() {
  socket.emit(CHANGE_COLOR_ACTION, username.value);
  const btnElement = changeColorBtn.value as unknown as HTMLButtonElement;
  btnElement.disabled = true;
  setTimeout(() => btnElement.disabled = false, 60000);
}

function registerUsername() {
  const inputUserNameElement = inputUserName.value as unknown as HTMLInputElement;
  if (!inputUserNameElement.value) {
    return;
  }
  localStorage.jaugeWarUsername = inputUserNameElement.value;
  localStorage.jaugeWarUUID = v4();
  userUUID = localStorage.jaugeWarUUID;
  username.value = localStorage.jaugeWarUsername;
  socket.emit(PLAYER_USERNAME_ACTION, {uuid: userUUID, username: username.value});
}


function background(color: string | undefined) {
  return `background: ${color}`;
}
</script>

<template>
  <h1 class="title"> Jauge War
    <span>Joueur·euse en ligne: {{ onlinePlayerCount }}</span>
  </h1>
  <canvas ref="canvas" width="500" height="500"></canvas>
  <div ref="canvasShadow" class="canvas-shadow"></div>
  <div class="btns-container">
    <button ref="top" class="increase-btn" :style="background(topColor)">+1</button>
    <button ref="bottom" class="increase-btn" :style="background(bottomColor)">+1</button>
  </div>
  <div class="meta-info">
    <button ref="changeColorBtn" class="change-color" :disabled="!!winningColorRef" @click="changeColor()">Change colors
    </button>
    <div class="user-name-form">
      <input v-if="!username" ref="inputUserName" type="text" class="user-name" placeholder="pseudo"/>
      <button v-if="!username" ref="goButton" @click="registerUsername()">GO</button>
      <span v-if="username">{{ username }} clicks : {{ userClicks }}</span>
    </div>
    <div class="shop">
      <button v-for="bonus in bonuses" @click="buyBonus(bonus, $event)">{{bonus.label}} - {{bonus.cost}} {{bonus.duration}}ms</button>
    </div>
    <div class="players-list" v-if="onlinePlayersRef">
      <span v-for="player in onlinePlayersRef">{{ player.user }} - {{ player.clicks }}</span>
    </div>
  </div>
  <div v-if="gameIsFinished" :style="background(winningColorRef)" class="victory-popup">
    <span>Victoire de {{ winningColorRef }} !</span>
    <span>Gagnant·e : {{ winnerRef }}</span>
    <span>Prochaine partie dans {{ timeRemainingRef }}s !</span>
  </div>
</template>


<style>


.arrow-element {
  position: absolute;
}

.fading-animation {
  animation: fadeOut 1000ms ease-in-out;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes buttonBackgroundDecrease {
  0% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}

</style>
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
  position: relative;
  border: 1px solid white;
  border-radius: 50px;
}

.canvas-shadow {
  position: absolute;
}

.meta-info {
  margin-top: 12px;
  width: 80%;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

.change-color {
  width: 10%;
  height: 30px;
  border-radius: 10px;
  border: none;
  font-weight: bold;
}

.user-name-form {
  display: flex;
  width: 20%;
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


.victory-popup {
  position: absolute;
  display: flex;
  flex-direction: column;
  width: 50%;
  height: 50%;
  top: 20%;
  justify-content: center;
  align-items: center;
  border-radius: 18px;
  border: 1px white solid;
  color: white;
  font-size: 2em;
  font-weight: bold;
}


.victory-popup span {
  text-align: center;
}

.shop {
  width: 30%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.shop button {
  width: 100%;
  border-radius: 12px;
  border: none;
  margin-top: 4px;
  text-wrap: none;
  overflow: hidden;
  word-break: keep-all;
  white-space: nowrap;
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

  .victory-popup {
    width: 80%;
  }
}

</style>
