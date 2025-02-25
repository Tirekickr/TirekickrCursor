const socket = new WebSocket('ws://127.0.0.1:8080/ws');

socket.onopen = () => {
  console.log('WebSocket connection established');
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

socket.onmessage = (event) => {
  console.log('Message from server:', event.data);
};