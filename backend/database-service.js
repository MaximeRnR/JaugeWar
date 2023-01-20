const serviceSupplier = require("./service-supplier");

const instance = serviceSupplier.databaseService();

module.exports = {
   databaseService: instance
}
