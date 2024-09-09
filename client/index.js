const socket = io('http://localhost:5050', { path: '/real-time' });

const divLogin = document.getElementById('div-login');
const formLogin = document.getElementById('form-login');
const divStart = document.getElementById('div-start');
const playerListDiv = document.getElementById('playerList');
const startGameBtn = document.getElementById('startGameBtn');
const marcoBtn = document.getElementById('marcoBtn');
const poloBtn = document.getElementById('poloBtn');
const gameProcessDiv = document.getElementById('game-process');
const poloSelectionDiv = document.getElementById('poloSelection');

// Evento de login
formLogin.addEventListener('submit', (event) => {
	event.preventDefault();
	const namePlayer = document.getElementById('name').value;

	// Emitir evento de login
	socket.emit('Client:Login', { name: namePlayer });

	localStorage.setItem('login', namePlayer);
	divLogin.style.display = 'none';
	divStart.classList.remove('hidden'); // Muestra la pantalla de jugadores
});

socket.on('updatePlayers', (players) => {
	playerListDiv.innerHTML = ''; // Limpiar lista de jugadores

	players.forEach((player) => {
		const playerElement = document.createElement('div');
		playerElement.textContent = player.name;
		playerListDiv.appendChild(playerElement);
	});

	// Mostrar el botón de inicio solo si hay 3 o más jugadores
	startGameBtn.style.display = players.length >= 3 ? 'block' : 'none';
});

startGameBtn.addEventListener('click', () => {
	socket.emit('startGame');
});

// Recibir el rol asignado y actualizar la interfaz de forma privada
socket.on('roleAssigned', ({ role }) => {
	divStart.classList.add('hidden');
	gameProcessDiv.classList.remove('hidden'); // Mostrar la interfaz de juego
	poloSelectionDiv.classList.remove('hidden'); // Mostrar selección de Polo

	// Mostrar el botón correcto basado en el rol recibido
	if (role === 'Marco') {
		marcoBtn.style.display = 'block';
		poloBtn.style.display = 'none';
		poloSelectionDiv.style.display = 'none'; // Ocultar selección de Polo para Marco
		alert('Tú eres "MARCO"'); // Solo el Marco verá este mensaje
	} else if (role === 'PoloEspecial') {
		poloBtn.style.display = 'block';
		marcoBtn.style.display = 'none';
		alert('Tú eres el "POLO Especial"'); // Solo el Polo Especial verá este mensaje
	} else {
		marcoBtn.style.display = 'none';
		poloBtn.style.display = 'block';
		alert('Tú eres "POLO"'); // Los demás jugadores verán este mensaje
	}
});

// Eventos para gritar Marco o Polo
marcoBtn.addEventListener('click', () => {
	socket.emit('marcoYell');
});

poloBtn.addEventListener('click', () => {
	socket.emit('poloYell');
});

// Eventos para seleccionar Polo
function selectPolo(poloId) {
	socket.emit('selectPolo', poloId);
}

document.querySelectorAll('#poloSelection button').forEach((button) => {
	button.addEventListener('click', (event) => {
		selectPolo(event.target.id);
	});
});

// Notificaciones de gritos Marco o Polo
socket.on('marcoYelled', () => {
	alert('Marco ha gritado');
});

socket.on('poloYelled', () => {
	alert('¡Polo ha gritado!');
});

socket.on('gameOver', (message) => {
	alert(message);
	location.reload(); // Reinicia el juego
});

socket.on('errorMessage', (message) => {
	alert(message);
});
