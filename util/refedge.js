
const connFactory = require('../util/connection-factory');
const logger = require('../common/logger');

module.exports = {
    saveTeamId: (conn, teamData) => {
        //////####### only for DEV purpose, do not push and revert back to refedge
        conn.apex.post('/pordev/rebot', teamData, (err, res) => {

            if (err) {
                logger.log(err);
            }
        });
    }
};