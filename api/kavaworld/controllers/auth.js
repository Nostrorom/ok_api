const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv')
require('colors');

const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});

// General

const errors = { email: '', password: ''}

const handle_errors = (err) => {
    console.log(err.message, err.code);

    if ( err.code === 11000 ) {
        errors[Object.keys(err.keyValue)] = 'Account already exists'
    };

    if ( err.message.includes('user validation failed') ) {

        Object.values(err.errors).forEach( ( {properties} ) =>  {
            errors[properties.path] = properties.message
            });
        };

    return errors;

    };

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: 10500
    })
};


// User signup & login

const login = async (req, res) => {

    const { email, password } = req.body;
    const user = await User.findOne({email});

    if (!user) {

        errors.email = `Cannot find an account for ${email}. Please check the email is correct, or create an account`;
        res.status(404).json({ errors });

    } else {
        let verified = user.verified ? true : false;

        if (!verified) {
        
                errors.email = `${email} is not verified, please verify it before logging in`;
                res.status(403).json({ errors });

        } else {
            let auth = await bcrypt.compare(password, user.password);

            if (auth === true) {

                console.log(`Successful login from `.gray + `${email}`.green);

                const token = createToken(user._id);
                res.status(201).json( {_id: user._id, username: user.username, jwt: token} );

            } else {
                console.log(`Failed login from `.gray + `${email}`.red);

                errors.password = `Incorrect password`
                res.status(403).json( {errors} );
            };
        };
    };
};

const signup = async (req, res) => {

    let { username, email, password } = req.body
    
    try {
        let salt = await bcrypt.genSalt();
        password = await bcrypt.hash(password, salt);
        let verificationCode = crypto.randomBytes(16).toString('hex');

        const user = await User.create({
            username,
            email,
            password,
            verified: false,
            blocked: false,
            verificationCode
        });

        const email_options = {
            from: '🥥 KAVA WORLD 🥥 <contact@kava-world.com>',
            to: `arnaud@yumiwork.com,marc@pacific-digital-transformation.com, louzemichael@yahoo.fr `,
            subject: 'New user registerd ! 👍',
            html: `<div style="background: #FAFAFA; padding: 20px 50px; text-align:center">
            <h3 style="color: #ff5F00; font-size: 1,5rem">
                Oraet !
            </h3>
            <p>A new user just joined Kava World :</p>
            <h3 style="color: #666">${username}</h3>
            <h4 style="color: #666; text-decoration: none">${email}</h4>
            <br>
            </div>`};

        await mailgun.messages().send(email_options);

        let token = createToken(user._id);

        res.status(201).json( {_id: user._id, username: user.username, jwt: token} );

    } catch (err) {
        const errors = handle_errors(err)

        res.status(400).json({ errors })
    };
};

// Email verification

const sendVerificationLink = async (req, res) => {

    const email = req.body.email;
    const user = await User.findOne({email});
    
    if (!user) {

        res.status(403).send({ error: `${email} is not registerd, make sure the e-mail is correct; or create a new account with this email` });
        
    } else {
        let verified = user.verified ? true : false;

        if (verified) {

        res.status(200).send({message: `Verified`})

        } else {
            let verificationCode = user.verificationCode;
        
            const email_options = {
                from: '🥥 KAVA WORLD 🥥 <contact@kava-world.com>',
                to: `${email}`,
                subject: 'Verify your email address',
                html: `<div style="background: #FAFAFA; padding: 20px 50px; text-align:center">
                <h3 style="color: #ff5F00; font-size: 1,5rem">
                    Welcome to Kava World !
                </h3>
                <p>Your verification code is</p>
                <h4 style="color: #666">${verificationCode}</h4>
                <p>Your can verify your email by clicking this button</p>
                <br>
                <a href="https://kava-world.org/verify?${email}+${verificationCode}" style="background: #ff5F00; padding: 10px 25px; border-radius: 5px; text-decoration:none; color: #fff">
                    Verify</a>
                    <br>
                    <br>
                    <p>or following this link</p>
                    <p>https://kava-world.org/verify?${email}+${verificationCode}</p>
                </div>`};

            try {
                await mailgun.messages()
                    .send(email_options
                        // (error, body) => {
                        // console.log("BODY MAIL RES", body);
                        // console.log("ERROR", error)
                        // }
                        );
        
                console.log(`📩 Email with verification code sent to `.gray + `${email}`.cyan);
        
                res.status(200).send({ message: `Email sent to ${email}. Please check your email to get your verification code`});
        
            } catch (err) {
                res.status(500).send({ error: `Error sending email to ${email}, make sure the e-mail is correct. If it still does not work please contact us for assistance` });
            };
        };
    };
};

const verifyEmail = async (req, res) => {

    const email = req.body.email;
    const code = req.body.verificationCode;
    const user = await User.findOne({email});

    if (!user) {

        res.status(403).send({ error: `${email} is not registerd, make sure the e-mail is correct; or create a new account with this email` });

    } else {

        let verified = user.verified ? true : false;
        
        if (verified) {
    
            res.status(200).send({message: `Verified`})
            
        } else {
            
            let checkCode = user.verificationCode;
        
            if (code && checkCode && code === checkCode) {

                try {
                    await User.updateOne( { email },
                        {
                            verified: true,
                            $unset: { verificationCode: '' }
                        });

                    console.log(`✅ Verified email for `.gray + `${email}`.green);

                    res.status(200).send({message: `Verified`});
                    
                } catch (err) {
                    res.status(403).send({error: `Verification failed. Make sure your email and code are correct`});
                };
            };
        };
    };
};


// Password reset

const sendResetLink = async (req, res) => {

    let email = req.body.email
    let user = await User.findOne({email});

    if (!user) {
        
        res.status(403).send({ error: `${email} is not registerd, make sure the e-mail is correct; or create a new account with this email` });
        
    } else {

        let verified = user.verified ? true : false;

        if (!verified) {

            res.status(403).send({ error: `${email} is not verified, please verify it before resetting your password` });

        } else {

            let resetCode = crypto.randomBytes(24).toString('hex');

            await User.updateOne( { email } , { resetCode } );

            const email_options = {
                from: '🥥 KAVA WORLD 🥥 <contact@kava-world.com>',
                to: `${email}`,
                subject: 'Reset your password',
                html: `<div style="background: #FAFAFA; padding: 20px 50px; text-align:center">
                <h3 style="color: #ff5F00; font-size: 1,5rem">
                    Password reset link
                </h3>
                <p>You asked for a password reset, if it wasn't you or you do not want to change it, you can log in normally.</p>
                <br>
                <p>If you wish to reset you password, you can click this button</p>
                <br>
                <a href="https://kava-world.org/resetpassword?${email}+${resetCode}" style="background: #ff5F00; padding: 10px 25px; border-radius: 5px; text-decoration:none; color: #fff">
                    Reset password</a>
                    <br>
                    <br>
                    <p>or follow this link</p>
                    <p>https://kava-world.org/resetpassword?${email}+${resetCode}</p>
                </div>`
            };

            try {
                await mailgun.messages()
                    .send(email_options
                        // (error, body) => {
                        // console.log("BODY MAIL RES", body);
                        // console.log("ERROR", error)
                        // }
                        );

                console.log(`📩 Email with reset code sent to `.gray + `${email}`.cyan);

                res.status(200).send({ message: `Email sent to ${email}. Please check your email to get a link to reset your password`});

            } catch (err) {
                res.status(500).send({ error: `Error sending email to ${email}, make sure the e-mail is correct. If it still does not work please contact us for assistance` });
            };
        };
    };
};

const resetPassword = async (req, res) => {

    let {email, resetCode, password } = req.body;
    const user = await User.findOne({email});

    if (user) {
        let checkCode = user.resetCode;

        if (checkCode === undefined) {
            res.status(400).send({error: `The reset link expired. Please request another one on the login page`})

        } else {

            if (checkCode === resetCode) {

                let salt = await bcrypt.genSalt();
                password = await bcrypt.hash(password, salt);

                try {
                    await User.updateOne( { email },
                        {
                            password,
                            $unset: { resetCode: '' }
                        });
    
                    console.log(`🔒 Password reset for `.gray + `${email}`.yellow);
    
                    const token = createToken(user._id);
                    res.status(200).json( {_id: user._id, username: user.username, jwt: token} );
                } catch (err) {
                    res.status(400).send({error: `There was an issue resetting your password. Please try again or contact us for assistance`})
                };
            } else {
                res.status(400).send({error: `The reset link does not seem to match. Make sure you used the last email received, or request another link in the login page`})
            };
        };
    };
};

module.exports = { signup, login, sendVerificationLink, verifyEmail, sendResetLink, resetPassword }

