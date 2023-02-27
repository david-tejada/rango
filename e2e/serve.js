const http = require("http");
const path = require("path");
const handler = require("serve-handler");

const publicPath = path.resolve(__dirname, "test-pages");

const server = http.createServer(async (request, response) => {
	return handler(request, response, { public: publicPath, cleanUrls: false });
});

server.listen(8080, () => {
	console.log("Running at http://localhost:8080");
});
