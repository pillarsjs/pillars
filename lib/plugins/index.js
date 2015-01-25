var logger = global.logger.pillars.addGroup('plugins');
module.exports = [
	require('./langPath.js'),
	require('./encoding.js'),
	require('./router.js'),
	require('./maxUploadSize.js'),
	require('./CORS.js'),
	require('./OPTIONS.js'),
	require('./sessions.js'),
	require('./accounts.js'),
	require('./bodyReader.js')
];