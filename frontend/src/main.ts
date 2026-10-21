import io from 'socket.io-client'

// const [loginForm, messageForm] = document.forms
// const usersElement = document.getElementById('users')
// const messagesElement = document.getElementById('messages')

const socket = io({ host: 'localhost', port: 3000, path: '/chat' })

socket.on('message', (message) => {
  console.log(message)
})

// const prepareMessage = ({ type, message }) => {
//   return JSON.stringify({
//     type,
//     message
//   })
// }

// loginForm.addEventListener('submit', event => {
//   event.preventDefault()
//   const inputElement = event.target.querySelector('input')
// ws.send(prepareMessage({
//     type: 'user:login',
//     message: inputElement.value
// }))
// })

// messageForm.addEventListener('submit', event => {
//   event.preventDefault()
//   const inputElement = event.target.querySelector('input')
// ws.send(prepareMessage({
//     type: 'message:send',
//     message: inputElement.value
// }))
// })

// const ws = new WebSocket('ws://localhost:3000/chat')

// ws.onopen = event => {
//     console.log('Opened')
// }

// ws.onmessage = event => {
//     const data = JSON.parse(event.data)

//     console.log('Message', {
//         type: data.type,
//         message: data.message,
//         time: Math.floor(event.timeStamp)
//     })

//     if (data.type === "user:list") {
//         usersElement.innerHTML = `Online: ${data.message.join(', ')}`
//     } else if (data.type === "message:receive") {
//         const pElement = document.createElement('p')
//         pElement.innerText = `${new Date().toLocaleTimeString('ru')} [${data.message.user}] ${data.message.message}`
//         messagesElement.appendChild(pElement)
//     } else if (data.type === "message:recent") {
//         messagesElement.append(
//             ...data.message.map(({ message, user }) => {
//                 console.log(message, user)
//                 const pElement = document.createElement('p')
//                 pElement.innerText = `${new Date().toLocaleTimeString('ru')} [${user}] ${message}`
//                 return pElement
//             })
//         )
//     }

// }

// ws.onerror = event => {
//     console.log('Error', event)
// }