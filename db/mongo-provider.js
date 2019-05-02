
const mongoose = require('mongoose');

module.exports = config => {

    if (!config) {
        throw new Error('missing options');
    }

    if (!config.mongoUri && !config.db) {
        throw new Error('missing db uri/instance');
    }
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    let db = config.db || mongoose.createConnection(config.mongoUri);
    let storage = {};
    let tables = ['teams', 'channels', 'users', 'orgs'];

    tables.forEach(tab => {
        let model = createModel(db, tab);
        storage[tab] = setupStorage(model);
    });
    return storage;
};

function createModel(db, table) {
    const schema = new mongoose.Schema({}, {
        strict: false,
        collection: table
    });

    try {
        return db.model(table, schema);
    } catch (err) {

        if (err.name === 'OverwriteModelError') {
            return db.model(table);
        } else {
            throw(err);
        }
    }
}

function setupStorage(table) {
    return {
        get: (id, cb) => {
            return table.findOne({ id: id }).lean().exec(cb);
        },
        save: (data, cb) => {
            return table
                .findOneAndUpdate({ id: data.id }, data, {
                    upsert: true,
                    new: true
                }).lean().exec(cb);
        },
        all: cb => {
            return table.find({}).lean().exec(cb);
        },
        delete: (id, cb) => {
            return table.deleteOne({ id: id }).lean().exec(cb);
        },
        find: (data, cb, options) => {
            return table.find(data, null, options).lean().exec(cb);
        }
    };
}