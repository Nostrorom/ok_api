const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const settings = require('./producer.json');

const producerSchema = new Schema(
    settings,
    { timestamps: true }
    )

const Producer = mongoose.model('producer', producerSchema)

module.exports = Producer;