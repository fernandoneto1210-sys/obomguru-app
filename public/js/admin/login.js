import { supabase } from "../supabase.js";

const formLogin = document.getElementById("formLogin");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const erroDiv = document.getElementById("erro");

// Verificar se já está logado
async function verificarSessao() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = "/admin/viagens.html";
  }
}

// Login
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    mostrarErro("Preencha email e senha.");
    return;
  }

  btnLogin.textContent = "ENTRANDO...";
  btnLogin.disabled = true;
  erroDiv.style.display = "none";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      mostrarErro(error.message === "Invalid login credentials" 
        ? "Email ou senha incorretos." 
        : error.message);
      btnLogin.textContent = "ENTRAR";
      btnLogin.disabled = false;
      return;
    }

    // Login OK
    window.location.href = "/admin/viagens.html";

  } catch (err) {
    console.error("Erro no login:", err);
    mostrarErro("Erro ao fazer login. Tente novamente.");
    btnLogin.textContent = "ENTRAR";
    btnLogin.disabled = false;
  }
});

function mostrarErro(mensagem) {
  erroDiv.textContent = mensagem;
  erroDiv.style.display = "block";
}

verificarSessao();
