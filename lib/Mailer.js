var nodemailer = require('nodemailer');

var mailTransport;
Object.defineProperty(ENV,"smtp",{
	enumerable : true,
	get : function(){return mailTransport;},
	set : function(set){
		mailTransport = nodemailer.createTransport(set);
	}
});

var mailer = module.exports = {};

mailer.send = function(mail,callback){
	if(!mail.from && ENV.administrator && ENV.administrator.mail){
		mail.from = ENV.administrator.mail;
		if(ENV.administrator.firstname){
			var fromName = (ENV.administrator.lastname)?ENV.administrator.firstname+' '+ENV.administrator.lastname:ENV.administrator.firstname;
			mail.from = fromName+' <'+mail.from+'>';
		}
	}
	if(mailTransport){
		ENV.emit('mail',mail);
		mailTransport.sendMail(mail, function(error,info){
			if(callback){callback(error,info);}
		});
	} else {
		if(callback){callback(new Error(i18n('pillars.mail.no-transport')));}
	}
}