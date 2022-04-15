<script setup lang="ts">

import {io} from "socket.io-client";
import {onMounted, ref} from "vue";

var HOST = location.origin.replace(/^http/, 'ws')
console.log(HOST);
const canvas = ref(null);
let ctx: CanvasRenderingContext2D | null;


const socket = io(HOST);
socket.on('jauge-war-state', function (jaugeWarState) {
  if (ctx) {
    ctx!.fillStyle = "#25A851";
    ctx!.fillRect(0, 0, 1000, jaugeWarState.topColor);
    ctx!.fillStyle = "#A8201D";
    ctx!.fillRect(0, 500-jaugeWarState.bottomColor, 1000, 500);
  }
});

onMounted(() => {
  const canvasElement = canvas.value as unknown as HTMLCanvasElement;
  ctx = canvasElement.getContext("2d");
});

function increaseColor(color: string) {
  socket.emit('jauge-action', `increase ${color}`)
}
</script>

<template>
  <h1> Jauge War </h1>
  <canvas ref="canvas" width="1000" height="500"></canvas>
  <div class="btns-container">
    <button class="increase-btn" style="background: #25A851" @click="increaseColor('top-color')">+1</button>
    <button class="increase-btn" style="background: #A8201D" @click="increaseColor('bottom-color')">+1</button>
  </div>
</template>

<style scoped>

.increase-btn {
  width: 50px;
  height: 30px;
  font-size: 1em;
}

.btns-container {
  margin-top: 12px;
  width: 50%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-direction: row;
}

.btns-container button {
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  color: white;
  outline: none;
  border: none;
}

canvas {
  border: 1px solid black;
  border-radius: 50px;
}
</style>
