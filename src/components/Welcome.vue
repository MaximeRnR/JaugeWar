<script setup lang="ts">

import {ref} from 'vue';

const username = ref('')
const password = ref('')
const error = ref(null)
const loggedIn = ref(false)
const roomName = ref('')

function login() {
  // login logic
  // check if username and password are valid
  // if valid, set loggedIn to true
  // if not, set error message
}

function createRoom() {
  // create room logic
  // send roomName to server and navigate to game page
}

</script>
<template>
  <div class="login-page">
    <h1 class="title">Welcome to Our Game</h1>
    <form>
      <label for="username">Username:</label>
      <input v-model="username" type="text" id="username" placeholder="Enter your username">
      <button v-on:click="login()">Login</button>
    </form>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="loggedIn">
      <div class="create-room-form">
        <h2>Create a Room:</h2>
        <label for="roomName">Room Name:</label>
        <input v-model="roomName" type="text" id="roomName" placeholder="Enter a name for your room">
        <button v-on:click="createRoom()">Create Room</button>
      </div>
    </div>
  </div>
</template>

<style>
.login-page {
  text-align: center;
  padding: 20px;
}

.title {
  font-size: 36px;
  margin-bottom: 20px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

form label {
  font-size: 18px;
  margin-bottom: 10px;
}

form input {
  padding: 10px;
  font-size: 18px;
  margin-bottom: 20px;
}

form button {
  padding: 10px 20px;
  font-size: 18px;
  background-color: #4CAF50;
  color: white;
}

.error-message {
  color: red;
  font-size: 18px;
  margin-bottom: 20px;
}

.create-room-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.create-room-form h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.create-room-form label {
  font-size: 18px;
  margin-bottom: 10px;
}

.create-room-form input {
  padding: 10px;
  font-size: 18px;
  margin-bottom: 20px;
}

.create-room-form button {
  padding: 10px 20px;
  font-size: 18px;
  background-color: #4CAF50;
  color: white;
}

</style>
