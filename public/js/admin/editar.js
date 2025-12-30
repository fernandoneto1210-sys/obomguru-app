import { supabase } from "../supabase.js";

const form = document.getElementById("formViagem");

const campos = {
  nome_viagem: document.getElementById("nome_viagem"),
  data_saida: document.getElementById("data_saida"),
  data_retorno: document.getElementById("data_retorno"),
  dicas: document.getElementById("dicas"),
  clima: document.getElementById("clima"),
  links_uteis: document.getElementById("links_uteis"),
  moeda: document.getElementById("moeda"),
  tomadas: document.getElementById("tomadas"),
  seguranca: document.getElementById("seguranca"),
  guia_nome: document.getElementById("guia_nome"),
  guia_whatsapp: document.getElementById("guia_whatsapp"),
  destino_id: document.getElementById("destino_id")
};

const id = new URLSearchParams(window.location.search).get("id");

async function carregar() {
  if (!id) return;

  const { data, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return;

  Object.keys(campos).forEach((c) => {
    campos[c].value = data[c] || "";
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {};
  Object.keys(campos).forEach((c) => (payload[c] = campos[c].value));

  if (id) {
    await supabase.from("viagens").update(payload).eq("id", id);
  } else {
    await supabase.from("viagens").insert(payload);
  }

  alert("Salvo com sucesso!");
  window.location.href = "/admin/viagens.html";
});

window.voltar = () => {
  window.location.href = "/admin/viagens.html";
};

window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/admin/index.html";
};

carregar();
