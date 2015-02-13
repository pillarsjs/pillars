/* jslint node: true */
"use strict";

module.exports = Chain;
function Chain(){
	var chain = this;
	var chainlinks = [];
	chain.data = {};
	chain.add = function(func){
		var args = Array.prototype.slice.call(arguments).slice(1);
		chainlinks.push({func:func,args:args});
		return chain;
	};
	chain.pull = function(){
		if(chainlinks.length>0){
			chainlinks[0].func.apply(chain,chainlinks[0].args);
		}
	};
	chain.next = function(){
		chainlinks.shift();
		chain.pull();
	};
}