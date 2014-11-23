var ObjectID = require('mongodb').ObjectID;
var logger = global.logger.pillars.plugins.addGroup('Accounts');

module.exports = new Plugin({id:'Accounts',priority:1005},function(gw,next){
	var account = gw.routing.check('account',false);
	if(account){
		if(gw.user){
			next();
		} else if(gw.session.user){
			var _id = gw.session.user;
			var users = DB.collection('users');
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			users.findOne({_id:_id},function(error, result) {
				if(!error && result){
					var user = new User(result);
					gw.user = user;
					gw.emit('user',user);
					next();
				} else {
					delete gw.session.user;
					gw.error(403);
				}
			});
		} else {
			gw.error(403);
		}
	} else {
		next();
	}
});

function User(udata){
	var user = this;
	for(var p in udata){
		user[p]=udata[p];
	}
	if(typeof user.keys === "string"){
		user.keys = user.keys.split(',');
	}
	if(!Array.isArray(user.keys)){user.keys=[];}
	user.can = function(keys){
		// Key validator based on current user keys, can test single key or array of keys, on first valid or empty key return true.
		if(!keys){return true;}
		if(typeof keys === 'string'){var keys = [keys];}
		if(Array.isArray(keys)){
			if(keys.length==0){return true;}
			for(var i in keys){
				if(keys[i]=='' || user.keys.indexOf(keys[i])>=0){
					return true;
				}
			}
		}
		return false;
	}
}