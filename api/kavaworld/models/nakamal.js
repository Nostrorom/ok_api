const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const settings = require('./nakamal.json');

const nakamalSchema = new Schema(
    settings,
    { timestamps: true }
    )

const Nakamal = mongoose.model('nakamal', nakamalSchema)

module.exports = Nakamal;