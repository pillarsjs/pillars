








Schema.prototype.count = function(user,params,cb){
	var schema = this;
	var query = {};

	var grant = false;
	if(user.can(schema.keys.manage) || user.can(schema.keys.see)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}
	if(grant){
		var db = DB.collection(schema.collection);
		db.count(query,function(error, count) {
			if(!error){
				cb({
					error : false,
					data : {
						count : count
					}
				});
			} else {
				cb({
					error : "database",
					details : error
				});
			}
		});
	} else {
		cb({
			error : "forbidden"
		});
	}
};

Schema.prototype.list = function(user,params,cb){
	var schema = this;
	var query = {};

	var skip = 0;
	var filter = false;
	var limit = schema.limit;
	var range = false;
	var order = schema.order || 1;
	var sort = schema.sort || false;
	var qsort = {};

	var grant = false;
	if(user.can(schema.keys.manage) || user.can(schema.keys.see)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$and = [];
		query.$and.push({
			$or:[{_author:user._id},{_guests:user._id}]
		});
	}
	if(grant){
		if(params._order=="-1"){var order = -1;}
		if(typeof params._sort === 'string'){
			for(var header in schema.headers){
				if(schema.headers[header] == params._sort){sort = params._sort;break;}
			}
		}
		if(typeof params._skip === 'string' && parseInt(params._skip)==params._skip){skip = parseInt(params._skip);}
		if(sort){
			qsort[sort] = order;
			if(typeof params._range === 'string'){
				range = params._range;
				query[sort]=order>0?{$gt:range}:{$lt:range};
			}
		}
		if(typeof params._filter === 'string' && params._filter!=""){
			filter = params._filter;
			var ors = [];
			for(i in schema.filter){
				var or = {};
				or[schema.filter[i]]=new RegExp(filter,"i");
				ors.push(or);
			}
			if(!query.$and){query.$and = [];}
			query.$and.push({$or:ors});
		}

		var cols = {};
		for(var header in schema.headers){cols[schema.headers[header]]=true;}

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
						list : results,
						order : order,
						sort : sort,
						range : range,
						skip : skip,
						limit : limit
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

Schema.prototype.one = function(user,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;

	var grant = false;
	if(user.can(schema.keys.manage) || user.can(schema.keys.see)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}
	if(grant){
		if(_id){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(error){
					cb({
						error : "database",
						details : error
					});
				} else if(!result) {
					cb({
						error : "noexist"
					});
				} else {
					schema.getter(result,user,function(getted,errors){
						if(errors){
							cb({
								error : "getter",
								ads : errors
							});
						} else {
							getted._id = _id;
							cb({
								error : false,
								data : getted
							});
						}
					});
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

Schema.prototype.update = function(user,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;
	var set = params['set'] || false;
	var unset = params['unset'] || false;

	var grant = false;
	if(user.can(schema.keys.manage)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}
	if(grant){
		if(_id && set){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(!error && result){
					var update = {};
					schema.unsetter(result,unset,user,function(unsetted,errors){
						if(errors){
								cb({
									error : "unsetter",
									ads : errors
								});
						} else {
							unsetted = treeParse(unsetted);
							if(Object.keys(unsetted).length>0){
								update.$unset = unsetted;
								for(var ui in unsetted){
									unsetted[ui]=1;
									try {
										eval("delete set."+ui+";");
									} catch(error) {}
								}
							}
							console.log(set);
							schema.setter(result,set,user,function(setted,errors){
								if(errors){
									cb({
										error : "setter",
										ads : errors
									});
								} else {
									console.log(setted);
									setted._mtime = new Date();
									update.$set = treeParse(setted);
									db.update({_id:_id},update,function(error, result) {
										if(error){
											cb({
												error : "database",
												details : error
											});
										} else if(result==0) {
											cb({
												error : "noexist"
											});
										} else {
											schema.one(gw,params,cb);
										}
									});
								}
							});
						}
					});
				} else {
					cb({
						error : "noexist"
					});
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

Schema.prototype.insert = function(user,params,cb){
	var schema = this;
	var set = params['set'] || false;

	var grant = false;
	if(user.can(schema.keys.manage) || user.can(schema.keys.edit)){
		grant = true;
	}
	if(grant){
		if(set){
			var _id = new ObjectID();
			set._id = _id;
			schema.setter(null,set,user,function(setted,errors){
				if(errors){
					cb({
						error : "setter",
						ads : errors
					});
				} else {
					setted._id = _id;
					setted._owner = user._id;
					setted._ctime = new Date();
					setted._mtime = new Date();
					var db = DB.collection(schema.collection);
					db.insert(setted,function(error, result) {
						if(error || !result[0] || !result[0]._id){
							cb({
								error : "database",
								details : error
							});
						} else {
							params._id = result[0]._id.toString();
							schema.one(gw,params,cb);
						}
					});
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

Schema.prototype.remove = function(user,params,cb){
	var schema = this;
	var query = {};
	var _id = params._id || false;


	var grant = false;
	if(user.can(schema.keys.manage)){
		grant = true;
	} else if(user.can(schema.keys.edit)){
		grant = true;
		query.$or = [{_author:user._id},{_guests:user._id}];
	}

	if(grant){
		if(_id){
			if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
			query._id = _id;
			var db = DB.collection(schema.collection);
			db.findOne(query,function(error, result) {
				if(!error && result){
					schema.unsetter(result,1,user,function(unsetted,errors){
						if(errors){
								cb({
									error : "unsetter",
									ads : errors
								});
						} else {
							db.remove(query,function(error, result) {
								if(error){
									cb({
										error : "database",
										details : error
									});
								} else if(result==0) {
									cb({
										error : "noexist"
									});
								} else {
									cb({error:false});
								}
							});
						}
					});
				} else {
					cb({
						error : "noexist"
					});
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
