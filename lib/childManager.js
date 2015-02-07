
var childManager = module.exports = {};

childManager.addChild = function addChild(collection){
	return function addChild(child, index){
		if(typeof index === 'string'){
			index = childManager.getChildPosition(collection).call(this, index);
		}
		if(Number.isInteger(index) && index >= 0 && index <= this[collection].length) {
			this[collection].splice(index, 0, child);
		} else {
			this[collection].push(child);
		}
		return this;
	};
};

childManager.getChild = function getChild(collection){
	return function getChild(childId){
		var index = childManager.getChildPosition(collection).call(this, childId);
		if(Number.isInteger(index)){
			return this[collection][index];
		}
	};
};
childManager.getChildPosition = function getChildPosition(collection){
	return function getChildPosition(childId){
		for(var i=0,l=this[collection].length;i<l;i++){
			if(this[collection][i].id === childId){
				return i;
			}
		}
	};
};
childManager.removeChild = function removeChild(collection){
	return function removeChild(childId){
		var index = childManager.getChildPosition(collection).call(this, childId);
		if(Number.isInteger(index)){
			this[collection].splice(index, 1);
			return true;
		}
	};
};
childManager.moveChild = function moveChild(collection){
	return function moveChild(childId, index, after){
		var childIndex = childManager.getChildPosition(collection).call(this, index);
		var child = this[collection][childIndex];

		if(typeof index === 'string'){
			index = childManager.getChildPosition(collection).call(this, index);
		}
		if(Number.isInteger(index) && index >= 0 && index <= this[collection].length && index != childIndex) {
			if(after){index++;}
			this[collection].splice(index, 0, child);
			this[collection].splice(childIndex, 1);
			return true;
		}
	};
};