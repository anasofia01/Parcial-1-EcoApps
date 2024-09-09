const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express(); // Creates HTTP server
app.use(express.json()); // utility to process JSON in requests
app.use(cors()); // utility to allow clients to make requests from other hosts or ips

const httpServer = createServer(app); // Explicity creates an HTTP server from the Express app

const io = new Server(httpServer, {
	path: '/real-time',
	cors: {
		origin: '*', // Allow requests from any origin
	},
}); // Creates a WebSocket server, using the same HTTP server as the Express app and listening on the /real-time path

const db = {
	players: [],
};

/* io.on('connection', (socket) => {
	// "joinGame" listerner
	socket.on('joinGame', (user) => {
		db.players.push(user);
		console.log(user);
		io.emit('userJoined', db); // Example: Broadcasts the message to all connected clients including the sender
		// socket.broadcast.emit("userJoined", db); // Example: Broadcasts the message to all connected clients except the sender
	});

	// implement "startGame" listener

	// implement "notifyMarco" listener

	// implement "notifyPolo" listener

	// implement "onSelectPolo" listener
}); */

let gameStarted = false;
let players = [];
let marco = null;
let specialPolo = null;

function assignRoles() {
	marco = players[Math.floor(Math.random() * players.length)];
	specialPolo = players[Math.floor(Math.random() * players.length)];
	while (specialPolo.id === marco.id) {
		specialPolo = players[Math.floor(Math.random() * players.length)];
	}
	io.emit('assignRoles', { marco, specialPolo });
}

io.on('connection', (socket) => {
	console.log('User connected', socket.id);

	socket.on('join-game', (player) => {
		if (gameStarted) {
			socket.emit('full', 'El juego ya está en progreso. Por favor espera.');
		} else if (players.length < 3) {
			players.push({ ...player, id: socket.id });
			socket.emit('waiting', `Te has unido. Esperando a otros jugadores...`);
			if (players.length === 3) {
				gameStarted = true;
				io.emit('start-game', '¡El juego comienza ahora!');
			}
		} else {
			socket.emit('full', 'El juego ya está lleno.');
		}
	});

	socket.on('startGame', () => {
		if (players.length >= 3) {
			assignRoles();
			io.emit('gameStarted', 'El juego inicio');
		} else {
			socket.emit('errorMessage', 'Se necesitan al menos 3 jugadores para iniciar el juego.');
		}
	});

	socket.on('marcoYell', () => {
		io.emit('marcoYelled', 'Alguien grito Marco');
	});

	socket.on('poloYell', (playerId) => {
		const poloPlayer = players.find((player) => player.id === playerId);
		io.emit('poloYelled', 'Alguien grito Polo', poloPlayer);
	});

	socket.on('selectPolo', (poloId) => {
		const selectedPolo = players.find((player) => player.id === poloId);
		if (selectedPolo.id === specialPolo.id) {
			io.emit('gameOver', 'Marco ha ganado seleccionando el Polo Especial.');
		} else {
			marco.role = 'Polo';
			selectedPolo.role = 'Marco';
			marco = selectedPolo;
			io.emit('rolesUpdated', { marco, selectedPolo });
		}
	});

	socket.on('disconnect', () => {
		players = players.filter((player) => player.id !== socket.id);
		console.log('Jugador desconectado:', socket.id);
		if (players.length < 3 && gameStarted) {
			io.emit('reset', 'Un jugador se ha desconectado. Reiniciando el juego.');
			resetGame();
		}
	});
});

function resetGame() {
	db.players = [];
	gameStarted = false;
	io.emit('reset', 'El juego ha sido reiniciado. Puedes jugar de nuevo.');
}

httpServer.listen(5050, () => {
	// Starts the server on port 5050, same as before but now we are using the httpServer object
	console.log(`Server is running on http://localhost:${5050}`);
});
