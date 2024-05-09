const createClient = require('@supabase/supabase-js').createClient;

class SupabaseDatabaseService {

    supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

    globalPlayers = new Map();
    gamesServers = [];

    addVictoryPointTo(player, victoryPoints) {
        if (this.globalPlayers.has(player.id)) {
            console.log("Adding victory points to player", player.id, victoryPoints)
            const victories = this.globalPlayers.get(player.id).victory;
            this.globalPlayers.set(player.id, {...player, victory: victories + victoryPoints});
            this.supabaseClient.from('jw-users').update({
                victory: victories + victoryPoints
            }).eq('id', player.id)
                .then(() => this.refreshPlayers())
        }

    }

    saveGameServer(gameServer) {
        this.gamesServers.push(gameServer);
    }

    getGamesServers() {
        return this.gamesServers;
    }

    getGlobalPlayers() {
        return this.globalPlayers
    }

    playerExist(playerId) {
        return this.globalPlayers.has(playerId);
    }

    async registerPlayer(player) {
        this.globalPlayers.set(player.id, {id: player.id, username: player.username, victory: 0});
        await this.supabaseClient.from('jw-users').insert({
            id: player.id,
            username: player.username,
            victory: 0
        });
    }

    async init() {
        console.log(process.env.SUPABASE_URL)
        console.log(process.env.SUPABASE_KEY)
        await this.supabaseClient.auth.signInAnonymously();
        await this.refreshPlayers();
    }

    async refreshPlayers() {
        this.globalPlayers = (await this.supabaseClient.from('jw-users').select("*")).data
            .map(it => ({key: it.id, value: {id: it.id, username: it.username, victory: it.victory}}))
            .reduce((acc, it) => acc.set(it.key, it.value), new Map())

    }
}

const instance = new SupabaseDatabaseService()
instance.init()
    .catch(console.error)

module.exports = {
    databaseService: instance
}
