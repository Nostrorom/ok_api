const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
// const Schema = mongoose.Schema;
// const settings = require('./user.json');

const userSchema = new mongoose.Schema(
    {
        email: {
          type: String,
          required: [true, 'Please enter an email'],
          unique: true,
          validate: [isEmail, 'Please enter a valid email'],
          lowercase: true
        },
        username: {
            type: String,
            unique: true
        },
        verified:{
            type: Boolean
        },
        blocked: {
            type: Boolean
        },
        password: {
            type: String,
            required: [true, 'Please enter a password'],
            minlengthe: [2, 'Minimum length']
        },
        verificationCode: {
            type: String
        },
        resetCode: {
            type: String
        }
    },
    { timestamps: true }
    )

// userSchema.pre('save', async function (next) {
//     const salt = await bcrypt.genSalt();
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// })

const User = mongoose.model('user', userSchema)

module.exports = User;