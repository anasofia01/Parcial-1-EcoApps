const socket = io('http://localhost:5050', {
	path: '/real-time',
});

const divLogin = document.getElementById('div-login');
const divInitGame = document.getElementById('div-initGame');
const formPlayer = document.getElementById('form-login');
formPlayer.addEventListener('submit', (event) => {
	event.preventDefault();
	const namePlayer = document.getElementById('name');
	socket.emit('Client:Login', {
		name: namePlayer.value,
		role: 'player',
	});
	localStorage.setItem('login', namePlayer.value);
	('Login successful');
	divLogin.style.display = 'none';
	namePlayer.value = '';
	divInitGame.style.display = 'block';
});

divInitGame.innerHTML = 'Waiting for the game to start';
socket.on('waiting-to-start', (message) => {
	divInitGame.innerHTML = message;
});

socket.on('game-started', () => {
	form.style.display = 'block';
	dataContainer.innerHTML = 'The game has started, please enter your details';
});

socket.on('reset', (message) => {
	dataContainer.innerHTML = message;
	form.style.display = 'none';
});
