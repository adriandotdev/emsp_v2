const nodemailer = require("nodemailer");
const winston = require("../config/winston");

const transporter = nodemailer.createTransport({
	name: process.env.NODEMAILER_NAME || "",
	host: process.env.NODEMAILER_HOST,
	port: process.env.NODEMAILER_PORT,
	secure:
		process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test"
			? false
			: true,
	auth: {
		user: process.env.NODEMAILER_USER,
		pass: process.env.NODEMAILER_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

module.exports = class Email {
	constructor(email_address, data) {
		this._email_address = email_address;
		this._data = data;
	}

	async SendFindEVPlugCredentials() {
		winston.info({
			CLASS_EMAIL_SEND_OTP_METHOD: {
				email: this._email_address,
				from: process.env.NODEMAILER_USER,
				to: this._email_address,
				data: this._data,
			},
		});

		try {
			const htmlFormat = `
				<h1>Find EV Plug PH</h1>

				<p>Dear User,</p>

				<p>Please be informed that the following details are confidential. Kindly do not share this information with anyone.</p>

				<h3>Party ID</h3>
				<p>${this._data.party_id}</p>
				
				<h3>Token C</h3>
				<p>${this._data.token_c}</p>
				
				<h3>Charging Point Operator ID</h3>
				<p>${this._data.cpo_owner_id}</p>

				<h3>Country Code</h3>
				<p>PH</p>

				<p>Thank you for your cooperation.</p>

				<p>Kind regards,</p>
				<p><b>Find EV Plug PH</b></p>
			`;

			let textFormat = `N/A`;
			// send mail with defined transport object
			const info = await transporter.sendMail({
				from: process.env.NODEMAILER_USER, // sender address
				to: this._email_address, // list of receivers
				subject: "Find EV Plug PH Credentials (no-reply)", // Subject line
				text: textFormat, // plain text body
				html: htmlFormat, // html body
			});

			winston.info({
				CLASS_EMAIL_SEND_OTP_METHOD: {
					message: info.messageId,
				},
			});
		} catch (err) {
			winston.error({ CLASS_EMAIL_SEND_OTP_METHOD: { err } });
			throw new Error({ connection: data.connection });
		}
	}
};
