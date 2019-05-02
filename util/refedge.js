
const connFactory = require('../util/connection-factory');
const logger = require('../common/logger');

module.exports = {
    getAccounts: async (teamId, botController) => {

        try {
            let conn = await connFactory.getConnection(teamId, botController);

            if (!conn) {
                throw new Error('not connected to salesforce.');
            }
            let result = await conn.query('SELECT Id, Name, Industry FROM Account LIMIT 2');

            if (!result.done) {
                // you can use the locator to fetch next records set.
                // Connection#queryMore()
                // console.log('next records URL:', result.nextRecordsUrl);
            }
            return result;
        } catch (err) {
            throw err;
        }
    },
    saveTeamId: (conn, teamData) => {
        conn.apex.post('/rebot', teamData, (err, res) => {

            if (err) {
                logger.log(err);
            }
        });
    }
};