module.exports = Chain;
function Chain(){
	var chain = this;
	var chainlinks = [];
	var failhandler = false;
	chain.data = {};
	chain.add = function(func){
		var args = Array.prototype.slice.call(arguments).slice(1);
		//var args = Array.slice(arguments,1);
		chainlinks.push({func:func,args:args});
		return chain;
	};
	chain.onfail = function(_failhandler){
		failhandler = _failhandler;
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
	chain.fail = function(error){
		if(failhandler){
			failhandler(error,chain);
		}
	};
}