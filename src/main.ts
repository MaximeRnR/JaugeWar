import { createApp } from 'vue'
import App from './App.vue'
import {createRouter, createWebHistory} from 'vue-router'
import Welcome from './components/Welcome.vue';
import JaugeWar from './components/JaugeWar.vue';
import useGameService from './services/GamesStateService';
import usePlayersService from './services/PlayersService';


const router = createRouter({
   history: createWebHistory(process.env.BASE_URL),
      routes: [{ path: '/', component: Welcome },
      { path: '/game/:gameId', component: JaugeWar }]}
)

const gameStateService = useGameService();
const playersService = usePlayersService();

createApp(App).use(router)
   .provide("gameStateService", gameStateService)
   .provide("playersService", playersService)
   .mount('#app')
