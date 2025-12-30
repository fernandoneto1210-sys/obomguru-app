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

    // Buscar tipo de usuário
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("tipo, auth_id")
      .eq("email", email)
      .maybeSingle();

    // Se não existir na tabela, criar como cliente
    if (!usuario) {
      await supabase.from("usuarios").insert({
        email,
        nome: email.split("@")[0],
        tipo: "cliente",
        auth_id: data.user.id,
      });
      window.location.href = "/minha-area.html";
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
    } else {
      window.location.href = "/minha-area.html";
    }
  });
}
