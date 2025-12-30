import { supabase } from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

if (!viagemId) {
  const erroEl = document.getElementById("erroViagem");
  if (erroEl) {
    erroEl.textContent = "ID da viagem não informado.";
    erroEl.style.display = "block";

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
  const titulo = data.nome_viagem || "Viagem";
  const tituloPage = document.getElementById("tituloViagem");
  const tituloCapa = document.getElementById("tituloViagemCapa");

  if (tituloPage) tituloPage.textContent = titulo;
  if (tituloCapa) tituloCapa.textContent = titulo;

  // ===== DATAS =====
  const datasEl = document.getElementById("datasViagem");
  if (datasEl) {
    if (data.data_saida && data.data_retorno) {
      const saida = formatarData(data.data_saida);
      const retorno = formatarData(data.data_retorno);
      datasEl.textContent = `${saida} a ${retorno}`;
    } else {
      console.warn("⚠️ Datas não encontradas");
      datasEl.textContent = "";
    }
  }

  // ===== IMAGEM DE CAPA =====
  // Você ainda não tem campo de imagem na tabela
  // Vamos usar uma imagem padrão por enquanto
  const imgEl = document.getElementById("imgCapaViagem");
  if (imgEl) {
    // Você pode adicionar um campo "imagem_capa" depois
    imgEl.src = "/img/default-viagem.jpg";
    imgEl.alt = titulo;
  }

  // ===== ROTEIRO DIA A DIA =====
  const roteiroEl = document.getElementById("roteiroTexto");
  if (roteiroEl) {
    const roteiro = data.roteiro_texto;

    if (roteiro && roteiro.trim().length > 0) {
      // Formatar o roteiro linha por linha
      roteiroEl.innerHTML = roteiro
        .split("\n")
        .filter(linha => linha.trim().length > 0)
        .map((linha) => `<p>${linha}</p>`)
        .join("");
    } else {
      console.warn("⚠️ roteiro_texto vazio ou ausente");
      roteiroEl.innerHTML = "<p>Roteiro não disponível.</p>";
    }
  }

  // ===== DICAS =====
  const dicasEl = document.getElementById("dicasViagem");
  if (dicasEl) {
    const dicas = data.dicas;

    if (dicas && dicas.trim().length > 0) {
      dicasEl.innerHTML = dicas
        .split("\n")
        .filter(linha => linha.trim().length > 0)
        .map((linha) => `<p>${linha}</p>`)
        .join("");
    } else {
      dicasEl.innerHTML = "<p>Dicas ainda não cadastradas.</p>";
    }
  }

  // ===== BOTÃO PDF DO ROTEIRO =====
  const btnPdf = document.getElementById("btnGerarPdfRoteiro");
  if (btnPdf && data.pdf_url) {
    btnPdf.textContent = "📄 Baixar PDF do Roteiro";
    btnPdf.onclick = () => {
      window.open(data.pdf_url, "_blank");
    };
  }

  // ===== WHATSAPP DO GUIA =====
  const linkWhatsApp = document.querySelector('a[href*="wa.me"]');
  if (linkWhatsApp && data.guia_whatsapp) {
    // Remove caracteres não numéricos
    const numero = data.guia_whatsapp.replace(/\D/g, "");
    linkWhatsApp.href = `https://wa.me/${numero}`;
  }

  // ===== LINK DO CLIMA (se tiver mapa_url ou clima específico) =====
  const linkClima = document.getElementById("linkClima");
  if (linkClima && data.clima) {
    // Você pode personalizar depois
    linkClima.href = `https://www.weather.com`;
  }
}

function formatarData(valor) {
  if (!valor) return "";
  const d = new Date(valor + "T00:00:00"); // Força timezone local
  if (isNaN(d.getTime())) {
    console.warn("⚠️ Data inválida:", valor);
    return "";
  }
  return d.toLocaleDateString("pt-BR");
}

// =======================
// CHECKLIST
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
// BOTÃO PDF CHECKLIST
// =======================
document
  .getElementById("btnGerarChecklistPdf")
  ?.addEventListener("click", () => {
    alert("Função de gerar PDF do checklist será implementada aqui.");
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
// INICIALIZAR
// =======================
carregarViagem();
carregarChecklist();
