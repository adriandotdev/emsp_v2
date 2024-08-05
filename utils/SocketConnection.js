const { Server } = require("socket.io");
const { HttpInternalServerError } = require("./HttpError");

class SocketConnection {
	static io = null;
	static instance;

	constructor() {
		if (this.instance) {
			throw new HttpInternalServerError(
				"SocketConnection has existing instance"
			);
		}

		this.instance = this;
	}

	static GetInstance() {
		return this.instance;
	}

	static InitializeSocket(server) {
		this.io = new Server(server);

		return this.io;
	}

	static GetIO() {
		if (this.io === null) {
			throw new HttpInternalServerError("SocketConnection not initialized");
		}

		return this.io;
	}
}

const socketConnection = Object.freeze(new SocketConnection());

module.exports = SocketConnection;
