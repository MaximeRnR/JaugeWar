const serviceSupplier = require("./service-supplier");
const {databaseService} = require("./database-service");

const instance =  serviceSupplier.gameService(databaseService);

module.exports = {
   gameService: instance
}
