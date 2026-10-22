import 'dotenv/config'

import * as z from "zod"
import nodemailer from "nodemailer";
import { getAccountSchema } from './schemas/accounts.schema.js';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendWelcomeMail = (accountInfo: z.output<typeof getAccountSchema>): Promise<void> => {
    const welcomeMessage = {
        from: process.env.EMAIL_USERNAME,
        to: accountInfo.email,
        subject: 'Welcome to 00ito',
        text: `Welcome to 00ito! Account created, now time to login`,
        html: '<p>Welcome to<b>00ito</b>! Account created, now time to login</p>'
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(welcomeMessage, (err, info) => {
            if (err) {
                reject(new Error(err.message))
            }

            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            resolve()
        });
    })
}

