import { supabase } from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

if (!viagemId) {
  const erroEl = document.getElementById("erroViagem");
  if (erroEl) {
    erroEl.textContent = "ID da viagem não informado.";
    erroEl.style.display = "block";
  }
}

// =======================
// CARREGAR VIAGEM
// =======================
async function carregarViagem() {
  console.log("🔎 Carregando viagem com id:", viagemId);

  const { data, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  if (error) {
    console.error("❌ Erro ao buscar viagem:", error);
  }
  console.log("📦 Dados da viagem vindos do Supabase:", data);

  const erroEl = document.getElementById("erroViagem");

  if (error || !data) {
    if (erroEl) {
      erroEl.textContent = "Viagem não encontrada.";
      erroEl.style.display = "block";
    }
    return;
  }

  // ===== TÍTULO =====
  const titulo = data.titulo || "Viagem";
  const tituloPage = document.getElementById("tituloViagem");
  const tituloCapa = document.getElementById("tituloViagemCapa");

  if (tituloPage) tituloPage.textContent = titulo;
  if (tituloCapa) tituloCapa.textContent = titulo;

  // ===== DATAS =====
  const datasEl = document.getElementById("datasViagem");
  if (datasEl) {
    if (data.data_inicio && data.data_fim) {
      datasEl.textContent =
        formatarData(data.data_inicio) + " a " + formatarData(data.data_fim);
    } else {
      console.warn("⚠️ data_inicio ou data_fim não vieram do banco:", {
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
      });
      datasEl.textContent = "";
    }
  }

  // ===== IMAGEM DE CAPA =====
  const imgEl = document.getElementById("imgCapaViagem");
  if (imgEl) {
    if (data.imagem_capa) {
      imgEl.src = data.imagem_capa;
    } else {
      console.warn("⚠️ imagem_capa não veio do banco. Usando imagem padrão.");
      imgEl.src = "/img/default-viagem.jpg";
    }
  }

  // ===== ROTEIRO =====
  const roteiroEl = document.getElementById("roteiroTexto");
  if (roteiroEl) {
    if (data.roteiro && data.roteiro.trim().length > 0) {
      roteiroEl.innerHTML = data.roteiro
        .split("\n")
        .map((linha) => `<p>${linha}</p>`)
        .join("");
    } else {
      console.warn("⚠️ roteiro vazio ou ausente na viagem.");
      roteiroEl.innerHTML = "<p>Roteiro não disponível.</p>";
    }
  }

  // ===== DICAS =====
  const dicasEl = document.getElementById("dicasViagem");
  if (dicasEl) {
    if (data.dicas && data.dicas.trim().length > 0) {
      dicasEl.innerHTML = data.dicas
        .split("\n")
        .map((linha) => `<p>${linha}</p>`)
        .join("");
    } else {
      dicasEl.innerHTML = "<p>Sem dicas no momento.</p>";
    }
  }
}

function formatarData(valor) {
  // Supabase geralmente manda como "2026-05-21" (string)
  if (!valor) return "";
  const d = new Date(valor);
  if (isNaN(d.getTime())) {
    console.warn("⚠️ Data inválida recebida:", valor);
    return "";
  }
  return d.toLocaleDateString("pt-BR");
}

// =======================
// CHECKLIST (ainda simples)
// =======================
function salvarChecklist() {
  if (!viagemId) return;
  const itens = {};
  document.querySelectorAll(".checklist-item").forEach((cb) => {
    itens[cb.dataset.item] = cb.checked;
  });
  localStorage.setItem("checklist_" + viagemId, JSON.stringify(itens));
}

function carregarChecklist() {
  if (!viagemId) return;
  const salvo = localStorage.getItem("checklist_" + viagemId);
  if (!salvo) return;
  const itens = JSON.parse(salvo);
  document.querySelectorAll(".checklist-item").forEach((cb) => {
    cb.checked = itens[cb.dataset.item] || false;
  });
}

// Eventos checklist
document.querySelectorAll(".checklist-item").forEach((cb) => {
  cb.addEventListener("change", salvarChecklist);
});

// =======================
// BOTÃO PDF CHECKLIST (placeholder)
// =======================
document
  .getElementById("btnGerarChecklistPdf")
  ?.addEventListener("click", () => {
    alert("Aqui vamos gerar o PDF do checklist.");
  });

// =======================
// BOTÃO SAIR
// =======================
document
  .getElementById("btnSairViagem")
  ?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });

// =======================
carregarViagem();
carregarChecklist();
