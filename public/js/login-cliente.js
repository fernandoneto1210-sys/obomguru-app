import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const erroEl = document.getElementById("erroLogin");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  erroEl.textContent = "";

  const email = emailInput.value.trim();
  const password = senhaInput.value;

  // Tentativa real de login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("LOGIN ERROR:", error);
    erroEl.textContent = "E-mail ou senha incorretos.";
    return;
  }

  // Buscar o tipo de usuário
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("auth_id", data.user.id)
    .maybeSingle();

  // Redirecionar conforme o tipo
  if (usuario?.tipo === "admin") {
    window.location.href = "/admin/viagens.html";
  } else {
    window.location.href = "/minha-area.html";
  }
});

