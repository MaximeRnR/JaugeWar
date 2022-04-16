<script setup lang="ts">

import {io} from "socket.io-client";
import {onMounted, ref} from "vue";

const HOST = location.origin.replace(/^http/, 'ws')
const canvas = ref(null);
const changeColorBtn = ref(null);
let ctx: CanvasRenderingContext2D | null;
const width = window.innerWidth * 0.8;
const height = 500;
let topColor = ref("#25A851");
let bottomColor = ref("#A8201D");

const socket = io(HOST);
socket.on('jauge-war-state', function (jaugeWarState) {
  if (ctx) {
    topColor.value = jaugeWarState.colors.topColorHex;
    bottomColor.value = jaugeWarState.colors.bottomColorHex;
    console.log(topColor.value)
    console.log(bottomColor.value)
    ctx!.fillStyle = jaugeWarState.colors.topColorHex;
    ctx!.fillRect(0, 0, width, jaugeWarState.topColor);
    ctx!.fillStyle = jaugeWarState.colors.bottomColorHex;
    ctx!.fillRect(0, 500-jaugeWarState.bottomColor, width, 500);
  }
});

onMounted(() => {
  const canvasElement = canvas.value as unknown as HTMLCanvasElement;
  ctx = canvasElement.getContext("2d");
  canvasElement.width = width;
  canvasElement.height = height

});

function increaseColor(color: string) {
  socket.emit('jauge-action', `increase ${color}`)
}

function background(color: string){
  return `background: ${color}`;
}

function changeColor(){
  socket.emit("change-color");
  var btnElement = changeColorBtn.value as unknown as HTMLButtonElement;
  btnElement.disabled = true;
  setTimeout(() => btnElement.disabled = false, 60000);
}
</script>

<template>
  <h1 class="title"> Jauge War </h1>
  <canvas ref="canvas" width="500" height="500"></canvas>
  <div class="btns-container">
    <button class="increase-btn" :style="background(topColor)" @click="increaseColor('top-color')">+1</button>
    <button class="increase-btn" :style="background(bottomColor)" @click="increaseColor('bottom-color')">+1</button>
  </div>
  <button ref="changeColorBtn" class="change-color" @click="changeColor()">Change colors</button>
</template>

<style scoped>

h1.title {
  color: white;
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
}

.btns-container button:active {
  border: none;
}

canvas {
  border: 1px solid white;
  border-radius: 50px;
}

.change-color {
  margin-top: 10px;
  width: 30%;
  height: 30px;
  border-radius: 10px;
  border: none;
  font-weight: bold;
}
</style>
