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
			<style>
				body {
					font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
					line-height: 1.8;
					color: #4a4a4a;
					background-color: #f3f4f6;
					margin: 0;
					padding: 0;
				}
				.container {
					width: 100%;
					max-width: 600px;
					margin: 40px auto;
					padding: 20px;
					border: 1px solid #e0e0e0;
					border-radius: 12px;
					background-color: #ffffff;
					box-shadow: 0 4px 8px rgba(0,0,0,0.05);
				}
				h1 {
					color: #2a2a2a;
					font-size: 24px;
					margin-bottom: 10px;
				}
				h2 {
					color: #6c757d;
					font-size: 18px;
					margin-bottom: 20px;
				}
				h3 {
					color: #2a2a2a;
					font-size: 16px;
					margin: 10px 0;
				}
				p {
					margin: 15px 0;
					font-size: 14px;
				}
				.confidential {
					color: #d9534f;
					font-weight: bold;
				}
				.footer {
					margin-top: 40px;
					font-size: 12px;
					color: #6c757d;
					text-align: center;
					border-top: 1px solid #e0e0e0;
					padding-top: 20px;
				}
				.header-img {
					width: 100%;
					height: auto;
					border-bottom: 1px solid #e0e0e0;
					margin-bottom: 20px;
					border-radius: 12px 12px 0 0;
				}
				.brand-name {
					font-weight: bold;
					color: #5a5a5a;
				}
			</style>
			<div class="container">
				<img src="https://services-parkncharge.sysnetph.com/uploads/FindEVPlug.png" alt="Header Image" class="header-img"/>
				<h1>Welcome to Find EV Plug PH</h1>
				<h2>NOTE: This platform currently accessible is merely the staging iteration of findevplug.ph.</h2>
				
				<p>Good day, CPO,</p>

				<p class="confidential">Please be informed that the following details are confidential. Kindly do not share this information with anyone.</p>

				<h3>Party ID: ${this._data.party_id}</h3>
				<h3>Token C: ${this._data.token_c}</h3>
				<h3>Username: ${this._data.username}</h3>
				<h3>Password: ${this._data.temporary_password}</h3>
				<h3>Country Code: PH</h3>

				<p>Thank you for your cooperation.</p>

				<p>Kind regards,</p>
				<p class="brand-name">Find EV Plug PH</p>

				<div class="footer">
					<p>This is an automated message, please do not reply directly to this email. For further assistance, contact support at support@findevplug.ph.</p>
				</div>
			</div>
			`;

			let textFormat = `
				Welcome to Find EV Plug PH

				NOTE: This platform currently accessible is merely the staging iteration of findevplug.ph.

				Good day, CPO,

				CONFIDENTIAL: Please be informed that the following details are confidential. Kindly do not share this information with anyone.

				Party ID: ${this._data.party_id}
				Token C: ${this._data.token_c}
				Username: ${this._data.username}
				Password: ${this._data.temporary_password}
				Country Code: PH

				Thank you for your cooperation.

				Kind regards,
				Find EV Plug PH

				This is an automated message, please do not reply directly to this email. For further assistance, contact support at support@findevplug.ph.
			`;
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
			throw err;
		}
	}
};
