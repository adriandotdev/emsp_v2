//config app for PM2
module.exports = {
	apps: [
		{
			name: "emsp_v2:4021", //label
			script: "server.js", //entrypoint
		},
	],
};
