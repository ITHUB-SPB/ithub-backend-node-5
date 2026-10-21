import io from 'socket.io-client'

type ChatMessage = {
  message: string
  user: string
}

const [loginForm, messageForm] = document.forms
const usersElement = document.getElementById('users')!
const messagesElement = document.getElementById('messages')!

const socket = io({ host: 'localhost', port: 3000, path: '/chat' })

loginForm.addEventListener('submit', event => {
  event.preventDefault()
  const inputElement = (event.target as HTMLFormElement).querySelector('input')!

  socket.emit('user:login', inputElement.value)
})

messageForm.addEventListener('submit', event => {
  event.preventDefault()
  const inputElement = (event.target as HTMLFormElement).querySelector('input')!

  socket.emit('message:send', inputElement.value)
})


socket.on("user:list", users => {
  usersElement.innerHTML = `Online: ${users.join(', ')}`
})

socket.on("message:receive", (messageObject: ChatMessage) => {
  const pElement = document.createElement('p')
  pElement.innerText = `${new Date().toLocaleTimeString('ru')} [${messageObject.user}] ${messageObject.message}`
  messagesElement.appendChild(pElement)
})

socket.on("message:recent", (messages: ChatMessage[]) => {
  messagesElement.append(
    ...messages.map(({ message, user }) => {
      console.log(message, user)
      const pElement = document.createElement('p')
      pElement.innerText = `${new Date().toLocaleTimeString('ru')} [${user}] ${message}`
      return pElement
    })
  )
})

// ws.onopen = event => {
//     console.log('Opened')
// }

// ws.onmessage = event => {
//     console.log('Message', {
//         type: data.type,
//         message: data.message,
//         time: Math.floor(event.timeStamp)
//     })
// }

// ws.onerror = event => {
//     console.log('Error', event)
// }