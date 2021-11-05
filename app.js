const express = require ('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
require('colors');

const app = express();
const PORT = process.env.PORT

// Middlewre

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Kava World

const KW_URI = process.env.ATLAS_KW_URI

const authRoutes = require('./api/kavaworld/routes/auth');

const BlogPost = require('./api/kavaworld/models/blogpost.js')
const Nakamal = require('./api/kavaworld/models/nakamal.js')
const Producer = require('./api/kavaworld/models/producer.js')
const Review = require('./api/kavaworld/models/review.js')
const User = require('./api/kavaworld/models/user.js')


// KavaWorld DB

mongoose
    .connect(
        KW_URI, 
        {
            useNewUrlParser: true, 
            useUnifiedTopology: true
        }
    ).then( 
        () => {  
            console.log( '🔵 [database] connected'.blue );
            app.listen(
                PORT, () => console.log(`🔵 [server] running on ${PORT}`.cyan))
        }
    ).catch(
        err => console.log( `🟡 [error] ${err}`.yellow )
    );

// KavaWorld Routes

app.get('/', (req,res) => {
    res.send('🐂🐂🐂   OK API   🦌🦌🦌')

})

app.get('/kavaworld/blogposts', (req, res) => {

    BlogPost.find()
        .sort({createdAt: -1})
        .then((result) => {
            res.send(result)
        })
        .catch((err) => console.log(`[error] ${err}`.yellow))
})

app.get('/kavaworld/nakamals', (req, res) => {

    Nakamal.find()
        .then((result) => {
            res.send(result)
        })
        .catch((err) => console.log(`[error] ${err}`.yellow))
})

app.get('/kavaworld/producers', (req, res) => {

    Producer.find()
        .then((result) => {
            res.send(result)
        })
        .catch((err) => console.log(`[error] ${err}`.yellow))
})

app.get('/kavaworld/reviews', (req, res) => {

    Review.find()
        .then((result) => {
            res.send(result)
        })
        .catch((err) => console.log(`[error] ${err}`.yellow))
})

app.get('/kavaworld/users', (req, res) => {

    User.find()
        .then((result) => {
            res.send(result)
        })
        .catch((err) => console.log(`[error] ${err}`.yellow))
})

app.use('/favicon.ico', express.static('static/images/favicon.png'));

app.use(authRoutes);
