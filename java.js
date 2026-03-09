// Example using fetch
fetch('https://your-ngrok-url.ngrok-free.app/api', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420' // This bypasses the warning page
    },
    body: JSON.stringify({ question: userInput })
});