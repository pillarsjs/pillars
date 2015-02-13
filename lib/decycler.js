/* jslint node: true */
"use strict";

module.exports = decycler;
function decycler(val,deep){
	deep = deep || 5;
	return decycleWalker([],[],val,deep);
}

function decycleWalker(parents,path,val,deep){
	if(['undefined','number','boolean','string'].indexOf(typeof val)>=0 || val === null){
		return val;
	} else if(typeof val === 'object' && val.constructor === Date){
		return '[Timestamp:'+val.getTime()+']';
	} else if(typeof val === 'object' && val.constructor === RegExp){
		return '[Regexp:'+val.toString()+']';
	} else if(typeof val === 'object' && typeof val.constructor.name === 'string' && val.constructor.name.slice(-5)==='Error'){
		return '['+val.stack?val.stack:val+']';
	} else if(typeof val === 'object'){
		if(parents.indexOf(val) >= 0){
			return '[Circular:'+path.slice(0,parents.indexOf(val)).join('.')+']';
		} else {
			var copy,i,k,l;
			if(typeof val.constructor.name === 'string' && val.constructor.name.slice(-5)==='Array'){
				if(parents.length>deep){
					return '[Array:'+val.constructor.name+']';
				} else {
					copy = [];
					for(i=0,l=val.length;i<l;i++){
						copy[i]=decycleWalker(parents.concat([val]),path.concat(i),val[i],deep);
					}
					return copy;
				}
			} else {
				if(parents.length>deep){
					return '[Object:'+val.constructor.name?val.constructor.name:'Object'+']';
				} else {
					copy = {};
					for(i=0,k=Object.keys(val),l=k.length;i<l;i++){
						copy[k[i]]=decycleWalker(parents.concat([val]),path.concat([k[i]]),val[k[i]],deep);
					}
					return copy;
				}
			}
		}
	} else if(typeof val === 'function') {
		return '[Function]';
	} else {
		return val.toString();
	}
}