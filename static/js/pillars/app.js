angular.module('PillarsCRUD', [
	'ngRoute',
	'Pillars.environment',
	'Pillars.filters',
	'Pillars.services',
	'Pillars.directives',
	'Pillars.controllers'
])
	.config(['$routeProvider', function($routeProvider) {
		$routeProvider
			.when('/', {
				controller:'crudList',
				templateUrl:'crud-list.html'
			})
			.when('/edit/:_id', {
				controller:'crudUpdate',
				templateUrl:'crud-editor.html'
			})
			.when('/new', {
				controller:'crudInsert',
				templateUrl:'crud-editor.html'
			})
			.otherwise({
				redirectTo:'/'
			});
	}])
	.run(function ($rootScope, env) {
		$rootScope.env = env;
	})
;