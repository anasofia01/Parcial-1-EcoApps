const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
	path: '/real-time',
	cors: {
		origin: '*',
	},
});

let players = [];
let marco = null;
let specialPolo = null;

function assignRoles() {
	marco = players[Math.floor(Math.random() * players.length)];
	specialPolo = players[Math.floor(Math.random() * players.length)];

	// Asegurarse de que el Marco y Polo especial no sean la misma persona
	while (specialPolo.id === marco.id) {
		specialPolo = players[Math.floor(Math.random() * players.length)];
	}

	// Enviar mensajes a los jugadores individualmente
	players.forEach((player) => {
		if (player.id === marco.id) {
			// Solo el jugador "Marco" recibe este mensaje
			io.to(player.id).emit('roleAssigned', { role: 'Marco' });
		} else if (player.id === specialPolo.id) {
			// Solo el jugador "PoloEspecial" recibe este mensaje
			io.to(player.id).emit('roleAssigned', { role: 'PoloEspecial' });
		} else {
			// Todos los demás reciben "Polo"
			io.to(player.id).emit('roleAssigned', { role: 'Polo' });
		}
	});
}

io.on('connection', (socket) => {
	console.log('Jugador conectado:', socket.id);

	// Almacenar a los jugadores conectados
	socket.on('Client:Login', ({ name }) => {
		const newPlayer = { id: socket.id, name };
		players.push(newPlayer);
		io.emit('updatePlayers', players); // Actualiza la lista de jugadores conectados
	});

	socket.on('disconnect', () => {
		players = players.filter((player) => player.id !== socket.id);
		io.emit('updatePlayers', players); // Actualiza la lista cuando un jugador se desconecta
		console.log('Jugador desconectado:', socket.id);
	});

	// Iniciar el juego
	socket.on('startGame', () => {
		if (players.length >= 3) {
			assignRoles(); // Asigna roles al iniciar el juego
			io.emit('gameStarted');
		} else {
			socket.emit('errorMessage', 'Se necesitan al menos 3 jugadores para iniciar el juego.');
		}
	});

	socket.on('marcoYell', () => {
		io.emit('marcoYelled');
	});

	// Enviar una señal genérica cuando cualquier "Polo" grite
	socket.on('poloYell', () => {
		io.emit('poloYelled'); // Solo notifica que "Polo" ha gritado sin nombres
	});
});

httpServer.listen(5050, () => {
	console.log('Servidor escuchando en http://localhost:5050');
});
