<script setup lang="ts">

import {io} from 'socket.io-client';
import {onMounted, ref} from 'vue';
import {v4} from 'uuid';
import {fromEvent, useObservable} from '@vueuse/rxjs';
import {interval, map, throttle} from 'rxjs';

import arrowDown from '../assets/white-down-arrow.png';
import arrowUp from '../assets/white-up-arrow.png';
import github from '../assets/github.png';
import twitter from '../assets/twitter-logo.png';
import jauge from '../assets/jauge.svg';
import {useRoute} from 'vue-router';


const HOST = location.origin.replace(/^http/, 'ws').replace('3001', '3000');
const route = useRoute();
const canvas = ref(null);
const canvasShadow = ref(null);
const changeColorBtn = ref(null);
const onlinePlayerCount = ref(0);
const onlinePlayersRef = ref(new Array<{ uuid: string, username: string, clicks: number, team: string, victory: number }>());
const currentUser = ref<{ uuid: string, username: string, clicks: number, team: string, victory: number } | null>(null);
const top = ref();
const bottom = ref();

let userUUID: string;
let username = ref<string | null>(null);
let topColor = ref('#25A851');
let bottomColor = ref('#A8201D');
let winningColorRef = ref<string>();
let winnerRef = ref<string>();
let mostClickWinnerRef = ref<string>();
let timeRemainingRef = ref<number>();
let currentJaugeWarState: { topColor: number, bottomColor: number, finished: boolean, direction: string };

let gameIsFinished = ref<boolean>(false);
let ctx: CanvasRenderingContext2D | null;
const width = window.innerWidth * 0.3;
const height = 500;

const socket = io(HOST + "/" + route.params.gameId)

const COLOR_CHANGED_EVENT = 'color-changed';
const ONLINE_PLAYERS_EVENT = 'online-players';
const PLAYERS_COUNT_EVENT = 'players-count';
const JAUGE_WAR_STATE_EVENT = 'jauge-war-state';
const VICTORY_EVENT = 'victory';

const JAUGE_ACTION = 'jauge-action';
const CHANGE_COLOR_ACTION = 'change-color';
const PLAYER_USERNAME_ACTION = 'player-username';

const THROTTLE_DELAY = 100;

const bonuses = [
  {id: 0, label: 'x2 - 10ck', cost: 10, duration: 10000},
  {id: 1, label: 'x5 - 50ck', cost: 50, duration: 5000}
];

socket.on(JAUGE_WAR_STATE_EVENT, function(jaugeWarState: { topColor: number, bottomColor: number, finished: boolean, direction: string }) {
  currentJaugeWarState = jaugeWarState;
  gameIsFinished.value = jaugeWarState.finished;
  draw();
  drawArrow(jaugeWarState.direction);
});

socket.on(COLOR_CHANGED_EVENT, function(colors: { topColorHex: string, bottomColorHex: string }) {
  topColor.value = colors.topColorHex;
  bottomColor.value = colors.bottomColorHex;
  document.querySelector('body')!.style.backgroundImage = `linear-gradient(-45deg, ${topColor.value}, ${bottomColor.value})`;
  draw();
});

socket.on(PLAYERS_COUNT_EVENT, (playersCount: number) => {
      onlinePlayerCount.value = playersCount;
    }
);

socket.on(ONLINE_PLAYERS_EVENT, (onlinePlayersWithClics: { uuid: string, username: string, clicks: number, team: string, victory: number }[]) => {
  currentUser.value = onlinePlayersWithClics?.filter(x => x.uuid === userUUID)[0];
  onlinePlayersRef.value = onlinePlayersWithClics?.sort((a, b) => b.clicks - a.clicks);
});

socket.on(VICTORY_EVENT, (victoryEvent: { winningColor: string, victoryTime: string, lastClickWinner: any, mostClickWinner: any }) => {
  winningColorRef.value = victoryEvent.winningColor;
  winnerRef.value = victoryEvent.lastClickWinner.username;
  mostClickWinnerRef.value = victoryEvent.mostClickWinner.username;
  if (victoryEvent.victoryTime) {
    const newGameStartDate = new Date(Date.parse(victoryEvent.victoryTime));
    newGameStartDate.setSeconds(newGameStartDate.getSeconds() + 30);
    const timeBeforeNewGame = setInterval(() => {
      const now = new Date().getTime();
      const timeRemaining = newGameStartDate.getTime() - now;
      timeRemainingRef.value = Math.floor((timeRemaining % (1000 * 60)) / (1000));
      if (timeRemaining <= 0) {
        winningColorRef.value = undefined;
        clearInterval(timeBeforeNewGame);
      }
    }, 1000);
  }

});

onMounted(() => {
  const canvasElement = canvas.value as unknown as HTMLCanvasElement;
  ctx = canvasElement.getContext('2d');
  canvasElement.width = width;
  canvasElement.height = height;
  const canvasShadowElement = canvasShadow.value as unknown as HTMLElement;
  canvasShadowElement.style.width = width + 'px';
  canvasShadowElement.style.height = height + 'px';
  if (localStorage.jaugeWarUUID && localStorage.jaugeWarUsername) {
    username.value = localStorage.jaugeWarUsername;
    userUUID = localStorage.jaugeWarUUID;
    socket.emit(PLAYER_USERNAME_ACTION, {uuid: localStorage.jaugeWarUUID, username: username.value});
    socket.emit(JAUGE_ACTION, {action: ``, username: username.value});
  }
});


function draw() {
  if (currentJaugeWarState && ctx) {
    ctx!.fillStyle = topColor.value;
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
  if (direction === 'down') {
    arrowElement.style.top = Math.floor(Math.random() * currentJaugeWarState.topColor) + 'px';
  }
  if (direction === 'up') {
    arrowElement.style.bottom = Math.floor(Math.random() * currentJaugeWarState.bottomColor) + 'px';
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

function buyBonus(bonus: any, event: any) {
  socket.emit('bonus-bought', {uuid: userUUID, bonusId: bonus.id});
  event.target.style.animation = `buttonBackgroundDecrease ${bonus.duration}ms ease-in`;
  setTimeout(() => {
    event.target.style.animation = `none`;
  }, bonus.duration);
}

function changeColor() {
  socket.emit(CHANGE_COLOR_ACTION, username.value);
  const btnElement = changeColorBtn.value as unknown as HTMLButtonElement;
  btnElement.disabled = true;
  setTimeout(() => btnElement.disabled = false, 60000);
}



function sortByVictory(players: any[]) {
  const copyPlayers = [...players];
  return copyPlayers.sort((a, b) => b.victory - a.victory);
}

function background(color: string | undefined) {
  return `background: ${color}`;
}

function color(team?: string) {
  return 'color: ' + (team === 'top' ? topColor.value : team === 'bottom' ? bottomColor.value : 'white');
}
</script>

<template>
  <span>Joueur·euse en ligne: {{ onlinePlayerCount }}</span>
  <div class="network">
    <a href="https://github.com/MaximeRnR/JaugeWar" title="Source code" target="_blank" rel="noopener"><img
        alt="github logo" :src="github"/></a>
    <a href="https://twitter.com/MrMasquime" title="@MrMasquime" target="_blank" rel="noopener"><img alt="twitter logo"
                                                                                                     :src="twitter"/></a>
  </div>
  <div class="play-area">
    <canvas ref="canvas" width="500" height="500"></canvas>
    <div ref="canvasShadow" class="canvas-shadow"></div>
    <div class="actions">
      <div class="shop">
        <div class="title">Bonus</div>
        <div class="subtitle">Achetez des bonus en utilisant vos clicks cummulés !</div>
        <span class="user-clicks" :style="color(currentUser?.team)" v-if="username">{{
            username
          }} clicks : {{ currentUser?.clicks }}</span>
        <div class="bonus-container">
          <button class="bonus-btn" v-for="bonus in bonuses" :disabled="bonus.cost > (currentUser?.clicks ?? 0)"
                  @click="buyBonus(bonus, $event)">{{ bonus.label }}
          </button>
        </div>
      </div>
      <div class="btns-container">
        <button ref="top" class="increase-btn" :style="background(topColor)">+1</button>
        <button ref="bottom" class="increase-btn" :style="background(bottomColor)">+1</button>
      </div>
    </div>
  </div>
  <div class="meta-info">
    <div class="players-list" v-if="onlinePlayersRef">
      <div class="leaderboard-title">Clicks</div>
      <div class="players-container">
        <span v-for="player in onlinePlayersRef" :style="color(player?.team)">
          <span>{{ player.username }}</span><span>{{ player.clicks }}</span>
        </span>
      </div>
    </div>

    <button ref="changeColorBtn" class="change-color" :disabled="!!winningColorRef" @click="changeColor()">Change colors
    </button>
    <div class="players-list" v-if="onlinePlayersRef">
      <div class="leaderboard-title">Leaderboard</div>
      <div class="players-container">
        <span v-for="player in sortByVictory(onlinePlayersRef)" :style="color(player?.team)">
          <span>{{ player.username }}</span><span>{{ player.victory }}<img :src="jauge" alt="victory_icon"/></span>
        </span>
      </div>
    </div>
  </div>
  <div v-if="gameIsFinished" :style="background(winningColorRef)" class="victory-popup">
    <span>Victoire de {{ winningColorRef }} !</span>
    <span>Dernier click : {{ winnerRef }}</span>
    <span>Le plus de clicks : {{ mostClickWinnerRef }}</span>
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
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  60% {
    opacity: 0;
  }
  65% {
    opacity: 1;
  }
  70% {
    opacity: 0;
  }
  75% {
    opacity: 1;
  }
  80% {
    opacity: 0;
  }
  85% {
    opacity: 1;
  }
  90% {
    opacity: 0;
  }
  95% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    width: 10%;
  }
}

</style>
<style scoped>


h1.title span {
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
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  height: 100%;
}

.btns-container button {
  border-radius: 10px;
  font-size: 2em;
  font-weight: bold;
  cursor: pointer;
  color: white;
  outline: none;
  height: 100%;
  width: 50%;
  border: 2px solid white;
  touch-action: manipulation;
  margin: 4px;
}

.btns-container button:active {
  border: none;
}

.play-area {
  position: relative;
  width: 80%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
}

.actions {
  position: relative;
  width: 70%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
}

.shop {
  width: 80%;
  font-size: 1.5em;
  display: flex;
  flex-direction: column;
}

.shop .title {
  font-weight: bold;
}

.shop .subtitle {
  font-style: italic;
  font-size: 0.8rem;
}

.shop .user-clicks {
  margin-top: 4px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 8px;
  width: fit-content;
}

.shop .bonus-container {
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: flex-start;
}

.shop .bonus-container .bonus-btn {
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  color: white;
  outline: none;
  height: 50px;
  border: 2px solid white;
  touch-action: manipulation;
  width: 100%;
  font-size: 1.5rem;
  background: transparent;
  margin-top: 4px;
  text-wrap: none;
  overflow: hidden;
  word-break: keep-all;
  white-space: nowrap;
}


.shop .bonus-container .bonus-btn:disabled {
  color: darkgrey;
  border-color: darkgrey;
}

canvas {
  position: relative;
  border: 1px solid white;
  border-radius: 50px;
}

.canvas-shadow {
  position: absolute;
  top: 0;
  left: 0;
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
  background: white;
  cursor: pointer;
}

.user-name-form {
  display: flex;
  width: 80%;
  justify-content: flex-start;
  align-items: center;
  margin-top: 8px;
  flex-wrap: wrap;
}

.user-name-form input {
  border-radius: 10px;
  border: 1px solid white;
  height: 20px;
  padding-left: 15px;
}

.user-name-form button {
  height: 20px;
  width: fit-content;
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
  position: relative;
  width: 30%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  max-height: 20vh;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 8px;
}

.players-list .leaderboard-title {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 8px;
  font-style: italic;
  color: white;
  position: absolute;
  top: 8px;
}

.players-list .players-container {
  margin-top: 24px;
  font-weight: bold;
  margin-left: 4px;
  font-size: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  max-height: 80%;
  overflow: auto;
}
.players-list .players-container > span {
  display: flex;
  width: 90%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.players-list .players-container span span {
  display: flex;
  align-items: center;
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

.victory-counter {
  display: flex;
}

.network {
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  padding: 12px;
}

.network a {
  margin: 4px;
  height: 25px;
  width: 25px;
}

.network img {
  height: 25px;
  width: 25px;
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


  .user-name-form {
    display: flex;
    width: 100%;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin-top: 8px;
    flex-wrap: wrap;
  }


  .user-name-form button {
    margin-top: 4px;
    margin-left: 0;
  }
}

</style>
