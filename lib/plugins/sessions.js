var ObjectID = require('mongodb').ObjectID;
var logger = Logger.pillars.plugins.addGroup('Sessions');

module.exports = new Plugin({id:'Sessions'},function(gw,next){
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
	} else if(!gw.cookie.sid) {
		newSession(gw,callback);
	} else {
		var sid = gw.cookie.sid = decrypt(gw.cookie.sid);
		if(sid && sid.id && /^[a-f0-9]{24}$/i.test(sid.id)){
			var sessions = DB.collection('sessions');
			var _id = new ObjectID.createFromHexString(sid.id);
			sessions.findOne({_id:_id,key:sid.key},function(error, result) {
				if(!error && result){
					gw.session = result.session;
					gw.emit('session',gw);
					callback();
				} else {
					newSession(gw,callback);
				}
			});
		} else {
			newSession(gw,callback);
		}
	}
}

function newSession(gw,callback){
	// Create a new session on database.
	var sessions = DB.collection('sessions');
	var key = Math.round(Math.random()*100000000000000000000000000000).toString(36);
	sessions.insertOne({timestamp:(new Date()),lastaccess:(new Date()),key:key},function(error, result) {
		if(!error && result.insertedCount==1){
			gw.cookie.sid = {
				id:result.insertedId.toString(),
				key:key
			};
			gw.setCookie('sid',encrypt(gw.cookie.sid),{maxAge:365*24*60*60});
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
	if(gw.session && sid && sid.id && /^[a-f0-9]{24}$/i.test(sid.id)){
		gw.emit('saveSession',gw);
		sid = new ObjectID.createFromHexString(sid.id);
		var sessions = DB.collection('sessions');
		sessions.updateOne({_id:sid},{$set:{session:gw.session,lastaccess:(new Date())}},function(error, result) {
			if(!error && result.modifiedCount==1){
				gw.emit('sessionSaved',gw);
			} else {
				logger.error('session.update-error',{error:error});
				gw.emit('sessionSaveError',gw);
			}
			if(callback){callback(error);}
		});
	} else {
		if(callback){callback(new Error('Unable to save the session, no SID or empty session.'));}
	}
}