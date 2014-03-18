
var pillars = require('../../pillars').Pillars;
//var pillarsFields = require('../../pillars').PillarsFields;

var sampleBeam = new pillars.Beam();
sampleBeam.setId('sample-beam');
sampleBeam.setTemplate('beams/sample/beam.jade');


var sampleAction = new pillars.Action('list',['get','put','/:_id'],function(req,res){
	beam = this;
	beam.db.find().toArray(function(error, result) {
		if(!error && result && result.length>0){
			for(var i in result){
				var _id = result[i]._id;
				result[i] = beam.fields.getter(result[i]);
				result[i]._id = _id;
			}
		}
		if(error){res.msgs.push(new msg("pillar.database.errors.list","model",error));}
		beam.template.view('list',req,res,result);
	});
});
sampleBeam.addAction(sampleAction);


sampleAction.status();
sampleBeam.status();

module.exports = sampleBeam;

/*






		myaction = new Action('list',['get','put','/:_id'],function(req,res){
			beam = this;
			beam.db.find().toArray(function(error, result) {
				if(!error && result && result.length>0){
					for(var i in result){
						var _id = result[i]._id;
						result[i] = beam.fields.getter(result[i]);
						result[i]._id = _id;
					}
				}
				if(error){res.msgs.push(new msg("pillar.database.errors.list","model",error));}
				beam.template.view('list',req,res,result);
			});
		});

		
		myaction = new Action('list',['get','put','/:_id'],function(req,res){
			beam = this;
			beam.db.findOne({_id:req.params._id},function(error, result) {
				if(!error && result){
					var _id = result._id;
					result = beam.fields.getter(result);
					result._id = _id;
				}
				if(error){res.msgs.push(new msg("pillar.database.errors.one","model",error));}
				if(!result){
					res.msgs.push(new msg("pillar.actions.one.noexist","actions","",{req:req,beam:beam}));
					beam.template.view('error',req,res);
				} else {
					beam.template.view('update',req,res,result);
				}
			});
		});

		myaction = new Action('list',['get','put','/:_id'],function(req,res){
			beam = this;
			if(!req.body || !req.body[beam.id]){
				beam.template.view('insert',req,res);
			} else {
				var doc = req.body[beam.id]
				var validate = beam.fields.validate(doc);
				if(validate.length>0){
					res.msgs.push(validate);
					beam.template.view('insert',req,res,doc);
				} else {
					doc = beam.fields.setter(doc);
					beam.db.insert(doc,function(error, result) {
						if(error){res.msgs.push(new msg("pillar.database.errors.insert","model",error);}
						if(!error && data[0]){
							res.msgs.push(new msg("pillar.actions.insert.ok","actions","",{req:req,beam:beam}));
							beam.actions.update.call(beam,req,res);
						} else {
							res.msgs.push(new msg("pillar.actions.insert.fail","actions","",{req:req,beam:beam}));
							beam.template.view('insert',req,res,doc);
						}
					});
				}
			}
		});

		myaction = new Action('list',['get','put','/:_id'],function(req,res){
			beam = this;
			var doc = req.body[beam.id]
			var validate = beam.fields.validate(doc);
			doc._id = id;
			if(validate.length>0){
				res.msgs.push(validate);
				beam.template.view('update',req,res,doc);
			} else {
				doc = panel.fields.setter(doc);
				beam.db.update(query,doc,function(error, result) {
					if(error){res.msgs.push(new msg("pillar.database.errors.update","model",error));}
					if(!error && data>0){
						res.msgs.push(new msg("pillar.actions.update.updated","actions","",{req:req,beam:beam}));
						beam.actions.update.call(beam,req,res);
					} else {
						res.msgs.push(new msg("pillar.actions.update.fail","actions","",{req:req,beam:beam}));
						beam.template.view('update',req,res,doc);
					}
				});
			}
		});

		myaction = new Action('list',['get','put','/:_id'],function(req,res){
			beam = this;
			beam.db.remove({_id:id},function(error, result) {
				if(error){res.msgs.push(new msg("pillar.model.errors.remove","model",error));}
				if(!error && data>0){
					res.msgs.push(new msg("pillar.actions.remove.ok","actions","",{req:req,beam:beam}));
					beam.actions.list.call(beam,req,res);
				} else {
					res.msgs.push(new msg("pillar.actions.remove.fail","actions","",{req:req,beam:beam}));
					beam.actions.update.call(beam,req,res);
				}
			});
		});



		var myadminpanel = new pillar.panel({
			uname : 'samplepanel',
			db : mongodb,
			collection : 'system',
			pathbase: 'admin',
			router: {
				list:[''],
				one:[':id'],
				insert:['get','post',':id'],
				update:['get','put',':id'],
				remove:{methods:['get'],path:':id'},
				


				one:['']
				insert:{path:'/new',method:'put|get',controller]
				update:{methods:'put'},
				remove:{methods:delete,controller:'remove'}
			}
			//id:'setup',
			fields : new pillar.fieldset({
				title : 'Un fieldset',
				details : 'Completa los campos',
				fields : {
					field1 : new pillar.fields.text({
						label : 'Field1',
						details : 'Rellena este campo...'
					}),
					field2 : new pillar.fields.text({
						label : 'Field2',
						details : 'Rellena este campo...'
					}),
					reverse : new pillar.fields.reverse({
						label : 'Reverse',
						details : 'Este va invertido en la bdd'
					}),
					textarea : new pillar.fields.textarea({
						i18n : true,
						label : 'Textarea i18n',
						details : 'Un campo internacional'
					}),
					field3 : new pillar.fields.text({
						label : 'Field1',
						details : 'Rellena este campo...'
					}),
					subset : new pillar.fields.subset({
						label : 'Multiples campos',
						details : 'Esto es un subset',
						fields : {
							subfield1 : new pillar.fields.text({
								label : 'subField1',
								details : 'Rellena este campo...'
							}),
							subfield2 : new pillar.fields.text({
								label : 'subField2',
								details : 'Rellena este campo...'
							})
						}
					}),
					field4 : new pillar.fields.text({
						label : 'Field2',
						details : 'Rellena este campo...'

					}),
					reverse2 : new pillar.fields.reverse({
						label : 'Reverse',
						details : 'Este va invertido en la bdd'
					}),
					textarea2 : new pillar.fields.textarea({
						i18n : true,
						label : 'Textarea i18n',
						details : 'Un campo internacional'
					})
				}
			}),
			fieldsets : {},
		});

*/