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

  const { data: viagem, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  console.log("📦 Dados da viagem recebidos:", viagem);

  const erroEl = document.getElementById("erroViagem");

  if (error || !viagem) {
    console.error("❌ Erro ao buscar viagem:", error);
    if (erroEl) {
      erroEl.textContent = "Viagem não encontrada.";
      erroEl.style.display = "block";
    }
    return;
  }

  // ===== TÍTULO =====
  const titulo = viagem.nome_viagem || "Viagem";
  document.getElementById("tituloViagem").textContent = titulo;
  document.getElementById("tituloViagemCapa").textContent = titulo;

  // ===== DATAS =====
  const datasEl = document.getElementById("datasViagem");
  if (viagem.data_saida && viagem.data_retorno) {
    const saida = formatarData(viagem.data_saida);
    const retorno = formatarData(viagem.data_retorno);
    datasEl.textContent = `${saida} a ${retorno}`;
  } else {
    datasEl.textContent = "";
  }

  // ===== IMAGEM DE CAPA =====
  const imgEl = document.getElementById("imgCapaViagem");
  if (imgEl) {
    // Usa a logo como capa padrão por enquanto
    imgEl.src = "/img/logo.png";
    imgEl.alt = titulo;
  }

  // ===== ROTEIRO DIA A DIA =====
  const roteiroEl = document.getElementById("roteiroTexto");
  const textoRoteiro = viagem.roteiro_texto;

  if (textoRoteiro && textoRoteiro.trim().length > 0) {
    // Cada quebra de linha no banco vira um <p> na tela
    roteiroEl.innerHTML = textoRoteiro
      .split("\n")
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0)
      .map(linha => `<p>${linha}</p>`)
      .join("");
  } else {
    console.warn("⚠️ roteiro_texto vazio ou nulo para esta viagem.");
    roteiroEl.innerHTML = "<p>Roteiro não disponível.</p>";
  }

  // ===== DICAS =====
  const dicasEl = document.getElementById("dicasViagem");
  if (dicasEl) {
    if (viagem.dicas && viagem.dicas.trim().length > 0) {
      dicasEl.innerHTML = viagem.dicas
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(l => `<p>${l}</p>`)
        .join("");
    } else if (viagem.informacoes_uteis && viagem.informacoes_uteis.trim().length > 0) {
      dicasEl.innerHTML = viagem.informacoes_uteis
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(l => `<p>${l}</p>`)
        .join("");
    } else {
      dicasEl.innerHTML = "<p>Dicas ainda não cadastradas.</p>";
    }
  }

  // ===== BOTÃO PDF DO ROTEIRO =====
  const btnPdf = document.getElementById("btnGerarPdfRoteiro");
  if (btnPdf) {
    if (viagem.pdf_url) {
      btnPdf.textContent = "📄 Baixar PDF do Roteiro";
      btnPdf.onclick = () => window.open(viagem.pdf_url, "_blank");
    } else {
      btnPdf.style.display = "none";
    }
  }

  // ===== WHATSAPP DO GUIA (SE TIVER) =====
  const linkWhats = document.querySelector('a[href*="wa.me"]');
  if (linkWhats && viagem.guia_whatsapp) {
    const numero = viagem.guia_whatsapp.replace(/\D/g, "");
    if (numero) {
      linkWhats.href = `https://wa.me/${numero}`;
    }
  }
}

function formatarData(valor) {
  if (!valor) return "";
  const d = new Date(valor + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

// =======================
// CHECKLIST (se você já tem no HTML)
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

document.querySelectorAll(".checklist-item").forEach((cb) => {
  cb.addEventListener("change", salvarChecklist);
});

document
  .getElementById("btnGerarChecklistPdf")
  ?.addEventListener("click", () => {
    alert("Depois implementamos o PDF do checklist aqui.");
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
