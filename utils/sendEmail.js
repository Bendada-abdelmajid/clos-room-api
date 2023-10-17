const path = require('path')
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');

module.exports = async (email, subject, template, context) => {
	try {
		const transporter = nodemailer.createTransport({
			
			service: process.env.SERVICE,
			
			auth: {
				user: process.env.USER,
				pass: process.env.PASS,
			},
		});
		
		const handlebarOptions = {
			viewEngine: {
			extName: ".handlebars",
			partialsDir: path.resolve('./templates'),
			defaultLayout: false,
			},
			viewPath: path.resolve('./templates'),
			extName: ".handlebars",
		}
		
		transporter.use('compile', hbs(handlebarOptions));

		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			template: template,
			context: context
		});
		console.log("email sent successfully");
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};