const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const settings = require('./review.json');

const reviewSchema = new Schema(
    settings,
    { timestamps: true }
    )

const Review = mongoose.model('review', reviewSchema)

module.exports = Review;