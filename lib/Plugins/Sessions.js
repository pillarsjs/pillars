var ObjectID = require('mongodb').ObjectID;
var logger = global.logger.pillars.plugins.addGroup('Sessions');

module.exports = new Plugin({id:'Sessions',priority:1004},function(gw,next){
	var session = gw.routing.check('session',false);
	var account = gw.routing.check('account',false);
	if((session || account) && !gw.session){
		getSession(gw,function(error){
			if(error){
				gw.error(500,error);
			} else {
				gw.on('close',function(){saveSession(gw);});
				next();
			}
		});
	} else {
		next();
	}
});

function getSession(gw,callback){
	// Check cookie for session id+key, if not, create a new session and send session cokkie.
	if(!DB) {
		callback(new Error(gw.i18n('pillars.plugins.session.store-error')));
	} else {
		var sid = gw.cookie.sid || false;
		var key = gw.cookie.sidkey || false;
		if(!sid || !key){
			newSession(gw,callback);
		} else {
			var sessions = DB.collection('sessions');
			if(/^[a-f0-9]{24}$/i.test(sid)){sid = new ObjectID.createFromHexString(sid);}
			sessions.findOne({_id:sid,key:key},function(error, result) {
				if(!error && result){
					gw.session = result.session;
					gw.emit('session',gw);
					callback();
				} else {
					newSession(gw,callback);
				}
			});
		}
	}
}

function newSession(gw,callback){
	// Create a new session on database.
	var sessions = DB.collection('sessions');
	var key = gw.timer.toString(36)+Math.round(Math.random()*10).toString(36);
	sessions.insertOne({timestamp:(new Date()),lastaccess:(new Date()),key:key},function(error, result) {
		if(!error && result.insertedCount==1){
			gw.cookie.sid = result.insertedId.toString();
			gw.cookie.sidkey = key;
			gw.setCookie('sid',gw.cookie.sid,{maxAge:365*24*60*60});
			gw.setCookie('sidkey',key,{maxAge:365*24*60*60});
			gw.session = {};
			gw.emit('session',gw,true);
			callback();
		} else {
			callback(new Error(gw.i18n('pillars.plugins.session.insert-error')));
		}
	});
}

function saveSession(gw,callback){
	// Save gw.session Objet on database.
	var sid = gw.cookie.sid || false;
	if(sid && gw.session){
		gw.emit('saveSession',gw);
		var sessions = DB.collection('sessions');
		if(/^[a-f0-9]{24}$/i.test(sid)){sid = new ObjectID.createFromHexString(sid);}
		sessions.updateOne({_id:sid},{$set:{session:gw.session,lastaccess:(new Date())}},function(error, result) {
			if(!error && result.modifiedCount==1){
				// Ok
				gw.emit('sessionSaved',gw);
			} else {
				// Maybe retry on error?
				logger.error('session.update-error',{error:error});
				gw.emit('sessionSaveError',gw);
			}
			if(callback){callback(error);}
		});
	} else {
		if(callback){callback(new Error('Unable to save the session, no SID or empty session.'));}
	}
}