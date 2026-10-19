const [loginForm, messageForm] = document.forms

loginForm.addEventListener('submit', event => {
    event.preventDefault()
    const inputElement = event.target.querySelector('input')
    ws.send(inputElement.value)
})

messageForm.addEventListener('submit', event => {
    event.preventDefault()
    const inputElement = event.target.querySelector('input')
    ws.send(inputElement.value)
})

const ws = new WebSocket('ws://localhost:3000')

ws.onopen = event => {
    console.log('Opened')
}

ws.onmessage = event => {
    console.log('Message', {
        data: event.data,
        time: Math.floor(event.timeStamp)
    })

    ws.send('Hello, server!')
}

ws.onerror = event => {
    console.log('Error', event)
}