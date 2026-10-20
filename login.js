const API_LOGIN = 'http://localhost:3000/api/login';

const form = document.querySelector('#form-login')
const inputUsuario = document.querySelector('#usuario')
const inputSenha = document.querySelector('#senha')
const msgErro = document.querySelector('#msg-erro')

// Se já estiver logado, vai direto para a tela principal
if (localStorage.getItem('logado') === 'true') {
  window.location.replace('index.html')
}

form.addEventListener('submit', async e => {
  e.preventDefault()
  msgErro.textContent = ''

  try {
    const response = await fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: inputUsuario.value,
        senha: inputSenha.value
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      localStorage.setItem('logado', 'true')
      window.location.href = 'index.html'
    } else {
      msgErro.textContent = data.error || 'Usuário ou senha inválidos'
    }
  } catch (error) {
    console.error('Erro no login:', error)
    msgErro.textContent = 'Erro ao conectar. Verifique se o servidor está rodando.'
  }
})
