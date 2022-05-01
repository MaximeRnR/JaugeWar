const {Client} = require('pg');
module.exports = {
    client: new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }),
    PostgresService: class PostgresService {
        client;

        constructor(client) {
            this.client = client;
            this.client.connect();
        }

        static createPlayersDataIfNotExist = `
            CREATE TABLE IF NOT EXISTS "players"
            (
                "id"
                SERIAL,
                "data"
                JSON,
                PRIMARY
                KEY
            (
                "id"
            )
                );`;
        static  loadPlayersData = `
            SELECT data
            FROM players`;

        static  insertPlayersData = (playersData) => `
            INSERT INTO players(id, data)
            VALUES (1, '${playersData}') ON CONFLICT
            ON CONSTRAINT players_pkey
                DO
            UPDATE SET data = '${playersData}'`

        async execute(query) {
            try {// gets connection
                return await this.client.query(query);
            } catch (error) {
                console.error(error.stack);
                return false;
            }
        };


        initDB() {
            return this.execute(PostgresService.createPlayersDataIfNotExist);
        }

        loadPlayersData() {
            return this.execute(PostgresService.loadPlayersData);
        }

        savePlayersData(playersData) {
            return this.execute(PostgresService.insertPlayersData(JSON.stringify(playersData)));
        }
    }
}

