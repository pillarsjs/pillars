var logger = global.logger.pillars.addGroup('plugins');
module.exports = [
	require('./LangPath.js'),
	require('./Encoding.js'),
	require('./Router.js'),
	require('./MaxUploadSize.js'),
	require('./CORS.js'),
	require('./OPTIONS.js'),
	require('./Sessions.js'),
	require('./Accounts.js'),
	require('./BodyReader.js')
];