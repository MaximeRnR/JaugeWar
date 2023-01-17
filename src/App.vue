<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import jwlogo from './assets/jwlogo.png';
</script>

<template>
  <h1 class="title">
  <img :src="jwlogo" alt="Jauge War"/>
</h1>
  <router-view/>
</template>

<style>
body {
  margin: 0;
  height: 100vh;
  width: 100vw;
  font-family: 'Roboto', sans-serif;

  background: linear-gradient(-45deg, #5e23d5, #2f901f);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}


@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

#app {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  background: transparent;
}

h1.title {
  display: flex;
  flex-direction: column;
  color: white;
}

h1.title img {
  height: 70px;
}

</style>
