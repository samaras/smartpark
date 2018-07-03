var nodemailer = require("nodemailer");
var Config = require('../config/config');

var smtpTransport = nodemailer.createTransport("SMTP",{
   service: Config.mail.service,
   auth: {
       user: Config.mail.user,
       pass: Config.mail.password
   }
});

module.exports = {
    sendMail: function(mail_details, callback) {

        if (mail_details==null) {
            mail_details = {
                from: "Smart Park <samuel@littlebuddhadigital.com>", // sender address
                to: "Samuel Komfi <skomfi@gmail.com>", // comma separated list of receivers
                subject: "Hello ✔", // Subject line
                text: "Hello world ✔", // plaintext body
                html: "<html><body><h2>Test Email Header</h2><p>This is test message body for the email being sent.</p></body></html>"
            }
        }

        smtpTransport.sendMail(mail_details, function(error, response){
            if(error){
                console.log(error);
                callback(error);
            } else {
                console.log("Message sent: " + response.message);
                callback(error, response.message);
            }
        });
    }
}