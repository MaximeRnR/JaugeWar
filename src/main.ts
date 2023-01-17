import { createApp } from 'vue'
import App from './App.vue'
import {createRouter, createWebHistory} from 'vue-router'
import Welcome from './components/Welcome.vue';
import JaugeWar from './components/JaugeWar.vue';


const router = createRouter({
   history: createWebHistory(process.env.BASE_URL),
      routes: [{ path: '/', component: Welcome },
      { path: '/game', component: JaugeWar }]}
)

createApp(App).use(router).mount('#app')
