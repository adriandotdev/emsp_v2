const { httpServer, io, app } = require("./app");

const logger = require("./config/winston");

/**
 * @param {import('socket.io').Socket} socket
 */
io.on("connection", (socket) => {
	logger.info(`Client connected: ${socket.id}`);

	socket.on("hub.evse-status-update", (arg, ack) => {
		logger.info({ event_name: "hub.evse-status-update", data: { arg } });

		ack({ message: "Status updated successfully" });
	});

	socket.on("emsp.evse-data-update", (arg, ack) => {
		logger.info({ event_name: "emsp.evse-data-update", data: { arg } });

		ack({ message: "Data updated successfully" });
	});

	socket.on("disconnect", () => {
		logger.info(`Client disconnected: ${socket.id}`);
	});
});

httpServer.listen(process.env.PORT, () => {
	logger.info("Server is running on port: " + process.env.PORT);
});
// io.use((socket, next) => {
// 	const token = socket.handshake.auth.token;

// 	if (!token) {
// 		return next(new Error("Authentication error"));
// 	}

// 	if (token === "tescxt") return next();

// 	return next(new Error("Authentication error"));
// });
