const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const settings = require('./blogpost.json');

const blogpostSchema = new Schema(
    settings,
    { timestamps: true }
    )

const BlogPost = mongoose.model('blogpost', blogpostSchema)

module.exports = BlogPost;