
module.exports = keysCheck;

function keysCheck(keys, action){
	var locks = this?this.keys:undefined;
	if(action){locks = locks?locks[action]:undefined;}
	if(!locks){return true;} // Unlocked action.
	if(!Array.isArray(locks)){locks = (typeof locks === 'string')?[locks]:[];}
	if(!Array.isArray(keys)){keys = (typeof keys === 'string')?[keys]:[];}

	var lock,grant;
	for(var i=0,l=locks.length;i<l;i++){ // OR...
		lock = locks[i].split(' ');
		grant = true;
		for(var i2=0,l2=lock.length;i2<l2;i2++){ // AND...
			if(keys.indexOf(lock[i2]) === -1){
				grant = false;
			}
		}
		if(grant){return true;}
	}
	return false;
}