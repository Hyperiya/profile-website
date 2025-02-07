const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const symbol = document.getElementById("avatarStatus");
    const activity = document.getElementById("activityStatus");

    if (symbol && data.status) {
        switch(data.status) {
            case 'online':
                symbol.src = "Assets/online.webp";
                break;
            case 'idle':
                symbol.src = "Assets/idle.webp";
                break;
            case 'dnd':
                symbol.src = "Assets/dnd.webp";
                break;
            default:
                symbol.src = "Assets/offline.webp";
        }
    }
    
    if (activity && data.activity && data.activity != "[object Object]") {
        activity.innerHTML = data.activity;
    }
};

ws.onopen = () => {
    console.log('Connected to bot');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};
