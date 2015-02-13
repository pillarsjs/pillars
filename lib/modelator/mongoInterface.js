
var ObjectID = require('mongodb').ObjectID;
var mongoInterface = module.exports = {};

mongoInterface.files = function(schema,params,cb,user){
	var query = {}, cols = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var grant = false;
	if(schema.keysCheck(keys,'get')){
		grant = true;
	} else if(user && schema.keysCheck(keys.concat(['owner']),'get')){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		var path = params.path || ''; // Warning, clean first and end '/'.
		var _id = path.split('/').slice(2,3).join();
		if(/^[a-f0-9]{24}$/i.test(_id)){
			_id = new ObjectID.createFromHexString(_id);
		} else {
			_id = false;
		}

		if(_id){
			var field = path.split('/').pop();
			query._id = _id;
			cols[field]=1;
			var db = DB.collection(schema.collection);
			db.findOne(query,cols,function(error, result) {
				if(error){
					cb({
						error : 500,
						details : error
					});
				} else if(!result) {
					cb({
						error : 404
					});
				} else {
					schema.get(result,function(getted, errors){
						if(errors){
							cb({
								error : 403,
								ads : errors
							});
						} else {
							var file = false;
							try {
								file = eval('getted.'+field);
							} catch(e) {}
							
							if(file){
								var pathfs = paths.resolve(paths.join(ENV.directories.uploads,schema.id,path));
								cb({
									error : false,
									data : {
										file: pathfs,
										name: file.name
									}
								});
							} else {
								cb({
									error : 404
								});
							}
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : 404
			});
		}
	} else {
		cb({
			error : 403
		});
	}
};

mongoInterface.count = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var grant = false;
	if(schema.keysCheck(keys,'get')){
		grant = true;
	} else if(user && schema.keysCheck(keys.concat(['owner']),'get')){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		var db = DB.collection(schema.collection);
		db.count(query,function(error,count) {
			if(error){
				cb({
					error : "database",
					details : error
				});
			} else {
				cb({
					error : false,
					data : {
						count : count
					}
				});
			}
		});
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.list = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var skip = 0;
	var filter = false;
	var limit = schema.limit;
	var range = false;
	var order = schema.order===-1?-1:1;
	var sort = schema.sort || false;
	var cols = {};

	var qsort = {},qors = [],i,l,qor;

	var grant = false;
	if(schema.keysCheck(keys,'get')){
		grant = true;
	} else if(user && schema.keysCheck(keys.concat(['owner']),'get')){
		grant = true;
		query.$and = [];
		query.$and.push({
			$or:[{_author:user._id},{_guests:user._id}]
		});
	}

	if(grant){
		if(parseInt(params._order,10)===-1){
			order = -1;
		}
		if(typeof params._sort === 'string' && params._sort !== ''){
			for(i=0,l=schema.headers.length;i<l;i++){
				if(schema.headers[i] === params._sort){
					sort = params._sort;
					break;
				}
			}
		}
		if(typeof params._skip === 'string' && parseInt(params._skip,10)>0){
			skip = parseInt(params._skip,10);
		}
		if(sort){
			qsort[sort] = order;
			if(typeof params._range === 'string' && params._range !== ''){
				range = params._range;
				query[sort]=order>0?{$gt:range}:{$lt:range};
			}
		}
		if(typeof params._filter === 'string' && params._filter !== ''){
			filter = params._filter;
			for(i=0,l=schema.filter.length;i<l;i++){
				qor = {};
				qor[schema.filter[i]]=new RegExp(filter,"i");
				qors.push(qor);
			}
			if(!query.$and){query.$and = [];}
			query.$and.push({$or:qors});
		}

		for(i=0,l=schema.headers.length;i<l;i++){cols[schema.headers[i]]=true;}

		var db = DB.collection(schema.collection);
		db.find(query,cols).sort(qsort).skip(skip).limit(limit).toArray(function(error, results) {
			if(error){
				cb({
					error : "database",
					details : error
				});
			} else {
				cb({
					error : false,
					data : {
						results : results,
						order : order,
						sort : sort,
						range : range,
						skip : skip,
						limit : limit,
						filter : filter,
						cols : cols
					}
				});
			}
		});
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.get = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];
	var _id = /^[a-f0-9]{24}$/i.test(params._id)?new ObjectID.createFromHexString(params._id):false;

	var grant = false;
	if(schema.keysCheck(keys,'get')){
		grant = true;
	} else if(user && schema.keysCheck(keys.concat(['owner']),'get')){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		if(_id){
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, doc) {
				if(error){
					cb({
						error : "database",
						details : error
					});
				} else if(!doc) {
					cb({
						error : "unreachable"
					});
				} else {
					schema.get(doc,function(getted, errors){
						if(errors){
							cb({
								error : "get",
								ads : errors
							});
						} else {
							getted._id = _id;
							cb({
								error : false,
								data : getted
							});
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.update = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];
	var _id = /^[a-f0-9]{24}$/i.test(params._id)?new ObjectID.createFromHexString(params._id):false;

	var set = params.set || false;
	var unset = params.unset || false;

	var grant = false;
	if(schema.keysCheck(keys,'update')){
		grant = true;
	} else if(user && schema.keysCheck(keys.concat(['owner']),'update')){
		grant = true;
		query = {_author:user._id};
	} else if(user && schema.keysCheck(keys.concat(['guest']),'update')){
		grant = true;
		query = {_guests:user._id};
	}

	if(grant){
		if(_id && set){
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, doc) {
				if(error){
					cb({
						error : "database",
						details : error
					});
				} else if(!doc){
					cb({
						error : "unreachable"
					});
				} else {
					var update = {};
					schema.remove(doc,unset,function(unsetted,errors){
						if(errors){
							cb({
								error : "remove",
								ads : errors
							});
						} else {
							unsetted = unsetted.parse();
							if(Object.keys(unsetted).length>0){
								update.$unset = unsetted;
							}
							schema.update(doc,set,function(setted,errors){
								if(errors){
									cb({
										error : "update",
										ads : errors
									});
								} else {
									setted._mtime = new Date();
									update.$set = setted.parse();
									db.update({_id:_id},update,function(error, result) {
										if(error){
											cb({
												error : "database",
												details : error
											});
										} else if(result === 0) {
											cb({
												error : "unreachable"
											});
										} else {
											mongoInterface.get(schema,params,cb,user);
										}
									});
								}
							},user,keys);
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.insert = function(schema,params,cb,user){
	var keys = (user && Array.isArray(user.keys))?user.keys:[];

	var set = params.set || false;

	var grant = false;
	if(schema.keysCheck(keys,'insert')){
		grant = true;
	}

	if(grant){
		if(set){
			var _id = new ObjectID();
			set._id = _id;
			schema.insert(set,function(setted, errors){
				if(errors){
					cb({
						error : "insert",
						ads : errors
					});
				} else {
					setted._id = _id;
					setted._owner = user?user._id:0;
					setted._ctime = new Date();
					setted._mtime = new Date();
					var db = DB.collection(schema.collection);
					db.insert(setted,function(error, result) {
						if(error){
							cb({
								error : "database",
								details : error
							});
						} else if(result.ok){
							cb({
								error : "unreachable"
							});
						} else {
							params._id = _id.toString();
							mongoInterface.get(schema,params,cb,user);
						}
					});
				}
			},user,keys);
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};

mongoInterface.remove = function(schema,params,cb,user){
	var query = {};
	var keys = (user && Array.isArray(user.keys))?user.keys:[];
	var _id = /^[a-f0-9]{24}$/i.test(params._id)?new ObjectID.createFromHexString(params._id):false;

	var grant = false;
	if(schema.keysCheck(keys,'remove')){
		grant = true;
	} else if(user && schema.keysCheck(keys.concat(['owner']),'remove')){
		grant = true;
		query = {_author:user._id};
	} else if(user && schema.keysCheck(keys.concat(['guest']),'remove')){
		grant = true;
		query = {_guests:user._id};
	}

	if(grant){
		if(_id){
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, doc) {
				if(error){
					cb({
						error : "insert",
						ads : errors
					});
				} else if(!doc){
					cb({
						error : "unreachable"
					});
				} else {
					schema.remove(doc,1,function(unsetted,errors){
						if(errors){
							cb({
								error : "remove",
								ads : errors
							});
						} else {
							db.remove(query,function(error, result) {
								if(error){
									cb({
										error : "database",
										details : error
									});
								} else if(result===0) {
									cb({
										error : "noexist"
									});
								} else {
									cb({
										error : false
									});
								}
							});
						}
					},user,keys);
				}
			});
		} else {
			cb({
				error : "params"
			});
		}
	} else {
		cb({
			error : "forbidden"
		});
	}
};





































