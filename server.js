const app = require("./app");
const { Server } = require("socket.io");

const httpServer = require("http").createServer(app);

const io = new Server(httpServer);

const logger = require("./config/winston");

io.on("connection", (socket) => {
	logger.info("client_connected");
});

httpServer.listen(process.env.PORT, () => {
	logger.info("Server is running on port: " + process.env.PORT);
});
