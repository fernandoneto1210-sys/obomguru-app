import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const erroEl = document.getElementById("erroLogin");
const statusEl = document.getElementById("statusLogin"); // opcional
const btnLogin = document.getElementById("btnLogin");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    limparErro();
    setStatus("");

    const email = emailInput.value.trim();
    const password = senhaInput.value;

    if (!email || !password) {
      mostrarErro("Preencha email e senha.");
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando...";

    // 1) LOGIN NO AUTH
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("ERRO DE LOGIN AUTH:", authError);
      mostrarErro("E-mail ou senha incorretos.");
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
      return;
    }

    const user = authData.user;
    console.log("✅ LOGIN AUTH OK:", user.email, user.id);

    // 2) BUSCAR USUÁRIO NA TABELA `usuarios` PELO EMAIL
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, email, nome, tipo, viagem_id")
      .eq("email", email)
      .maybeSingle();

    if (usuarioError) {
      console.error("ERRO BUSCANDO USUARIO:", usuarioError);
      mostrarErro("Erro ao buscar dados do usuário.");
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
      return;
    }

    console.log("🔎 USUARIO NA TABELA:", usuario);

    // 3) SE NÃO EXISTIR, CRIA COMO CLIENTE SEM VIAGEM
    if (!usuario) {
      console.log("Usuário NÃO encontrado em `usuarios`. Criando como cliente padrão.");
      const { error: insertError } = await supabase.from("usuarios").insert({
        email,
        nome: email.split("@")[0],
        tipo: "cliente",
        viagem_id: null,
      });

      if (insertError) {
        console.error("ERRO INSERINDO USUARIO:", insertError);
        mostrarErro("Erro ao registrar usuário. Contate o administrador.");
        btnLogin.disabled = false;
        btnLogin.textContent = "Entrar";
        return;
      }

      mostrarErro("Cadastro criado! Peça ao administrador para vincular sua viagem.");
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
      return;
    }

    // 4) DECISÃO DE REDIRECIONAMENTO SIMPLES
    console.log("TIPO:", usuario.tipo, "VIAGEM_ID:", usuario.viagem_id);

    if (usuario.tipo === "admin") {
      setStatus("Redirecionando para painel administrativo...");
      window.location.href = "/admin/viagens.html";
    } else if (usuario.tipo === "cliente") {
      if (usuario.viagem_id) {
        setStatus("Redirecionando para sua viagem...");
        window.location.href = `/viagem.html?id=${usuario.viagem_id}`;
      } else {
        mostrarErro("Você ainda não está vinculado a nenhuma viagem. Fale com o administrador.");
        btnLogin.disabled = false;
        btnLogin.textContent = "Entrar";
      }
    } else {
      // qualquer outro valor inesperado em tipo
      console.warn("TIPO DESCONHECIDO:", usuario.tipo);
      mostrarErro("Tipo de usuário desconhecido. Contate o administrador.");
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
    }
  });
}

function mostrarErro(msg) {
  if (!erroEl) return;
  erroEl.textContent = msg;
  erroEl.style.display = "block";
}

function limparErro() {
  if (!erroEl) return;
  erroEl.textContent = "";
  erroEl.style.display = "none";
}

function setStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg;
}
