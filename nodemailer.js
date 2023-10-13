const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
require('dotenv').config();

const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
    REDIRECT_URI);
authClient.setCredentials({ refresh_token: REFRESH_TOKEN });

async function mailer(receiver, id, key) {
    try {
        const ACCESS_TOKEN = await authClient.getAccessToken();
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.sender_email,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: ACCESS_TOKEN
            }
        })
        const details = {
            from: process.env.sender_name_email,
            to: receiver,
            subject: "Forgot Password",
            text: "message text",
            html: `Hey you can recover your account by clicking following link <a href="http://localhost:3000/forgot/${id}/${key}">localhost:3000/forgot/${id}/${key}</a>`
        }
        const result = await transport.sendMail(details);
        return result;
    }
    catch (err) {
        return err;
    }
}

// mailer().then(res => {
//     console.log("sent mail !", res);
//    })

module.exports = mailer;