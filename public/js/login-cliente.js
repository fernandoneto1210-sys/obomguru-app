import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const erroEl = document.getElementById("erroLogin");
const btnLogin = document.getElementById("btnLogin");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erroEl.textContent = "";
    erroEl.style.display = "none";

    const email = emailInput.value.trim();
    const password = senhaInput.value;

    if (!email || !password) {
      erroEl.textContent = "Preencha email e senha.";
      erroEl.style.display = "block";
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando...";

    // Login real
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("ERRO DE LOGIN:", error);
      erroEl.textContent = "E-mail ou senha incorretos.";
      erroEl.style.display = "block";
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
      return;
    }

    console.log("✅ LOGIN OK:", data.user.email);

    // Buscar tipo de usuário e viagem vinculada
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("tipo, auth_id, viagem_id")
      .eq("email", email)
      .maybeSingle();

    // Se não existir na tabela, criar como cliente sem viagem
    if (!usuario) {
      await supabase.from("usuarios").insert({
        email,
        nome: email.split("@")[0],
        tipo: "cliente",
        auth_id: data.user.id,
        viagem_id: null,
      });
      erroEl.textContent = "Usuário criado! Entre em contato com o administrador para vincular sua viagem.";
      erroEl.style.display = "block";
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
      return;
    }

    // Atualizar auth_id se necessário
    if (!usuario.auth_id) {
      await supabase
        .from("usuarios")
        .update({ auth_id: data.user.id })
        .eq("email", email);
    }

    // Redirecionar conforme tipo
    if (usuario.tipo === "admin") {
      window.location.href = "/admin/viagens.html";
    } else if (usuario.viagem_id) {
      // Cliente com viagem vinculada → vai para a página da viagem
      window.location.href = `/viagem.html?id=${usuario.viagem_id}`;
    } else {
      // Cliente sem viagem vinculada
      erroEl.textContent = "Você ainda não está vinculado a nenhuma viagem. Entre em contato com o administrador.";
      erroEl.style.display = "block";
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
    }
  });
}
