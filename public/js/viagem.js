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
// CARREGAR VIAGEM (MESMA LÓGICA PARA TODOS OS DESTINOS)
// =======================
async function carregarViagem() {
  console.log("🔎 Carregando viagem com id:", viagemId);

  const { data: viagem, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  console.log("📦 Dados da viagem vindos do Supabase:", viagem);

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
  const tituloPage = document.getElementById("tituloViagem");
  const tituloCapa = document.getElementById("tituloViagemCapa");
  if (tituloPage) tituloPage.textContent = titulo;
  if (tituloCapa) tituloCapa.textContent = titulo;

  // ===== DATAS =====
  const datasEl = document.getElementById("datasViagem");
  if (datasEl && viagem.data_saida && viagem.data_retorno) {
    const saida = formatarData(viagem.data_saida);
    const retorno = formatarData(viagem.data_retorno);
    datasEl.textContent = `${saida} a ${retorno}`;
  }

  // ===== IMAGEM DE CAPA (LOGO POR ENQUANTO) =====
  const imgEl = document.getElementById("imgCapaViagem");
  if (imgEl) {
    imgEl.src = "/img/logo.png";
    imgEl.alt = titulo;
  }

  // ===== ROTEIRO DIA A DIA (USANDO roteiro_texto) =====
  const roteiroEl = document.getElementById("roteiroTexto");
  if (roteiroEl) {
    const texto = viagem.roteiro_texto;
    if (texto && texto.trim().length > 0) {
      roteiroEl.innerHTML = texto
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(l => `<p>${l}</p>`)
        .join("");
    } else {
      roteiroEl.innerHTML = "<p>Roteiro não disponível.</p>";
    }
  }

  // ===== DICAS / INFORMAÇÕES =====
  const dicasEl = document.getElementById("dicasViagem");
  if (dicasEl) {
    const blocos = [];

    if (viagem.dicas && viagem.dicas.trim().length > 0) {
      blocos.push(
        viagem.dicas
          .split("\n")
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => `<p>${l}</p>`)
          .join("")
      );
    }

    if (viagem.informacoes_uteis && viagem.informacoes_uteis.trim().length > 0) {
      blocos.push(
        "<h3>Informações Úteis</h3>" +
          viagem.informacoes_uteis
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .map(l => `<p>${l}</p>`)
            .join("")
      );
    }

    dicasEl.innerHTML =
      blocos.length > 0 ? blocos.join("<hr>") : "<p>Dicas ainda não cadastradas.</p>";
  }

  // ===== PDF DO ROTEIRO =====
  const btnPdf = document.getElementById("btnGerarPdfRoteiro");
  if (btnPdf) {
    if (viagem.pdf_url) {
      btnPdf.textContent = "📄 Baixar PDF do Roteiro";
      btnPdf.onclick = () => window.open(viagem.pdf_url, "_blank");
    } else {
      btnPdf.style.display = "none";
    }
  }

  // ===== WHATSAPP GUIA (SE TIVER) =====
  const linkWhats = document.querySelector('a[href*="wa.me"]');
  if (linkWhats && viagem.guia_whatsapp) {
    const numero = viagem.guia_whatsapp.replace(/\D/g, "");
    if (numero) linkWhats.href = `https://wa.me/${numero}`;
  }
}

function formatarData(valor) {
  if (!valor) return "";
  const d = new Date(valor + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

// =======================
// CHECKLIST (LOCALSTORAGE POR VIAGEM)
// =======================
function salvarChecklist() {
  if (!viagemId) return;
  const itens = {};
  document.querySelectorAll(".checklist-item").forEach(cb => {
    itens[cb.dataset.item] = cb.checked;
  });
  localStorage.setItem("checklist_" + viagemId, JSON.stringify(itens));
}

function carregarChecklist() {
  if (!viagemId) return;
  const salvo = localStorage.getItem("checklist_" + viagemId);
  if (!salvo) return;
  const itens = JSON.parse(salvo);
  document.querySelectorAll(".checklist-item").forEach(cb => {
    cb.checked = itens[cb.dataset.item] || false;
  });
}

document.querySelectorAll(".checklist-item").forEach(cb => {
  cb.addEventListener("change", salvarChecklist);
});

document
  .getElementById("btnGerarChecklistPdf")
  ?.addEventListener("click", () => {
    alert("PDF do checklist será implementado depois.");
  });

document
  .getElementById("btnSairViagem")
  ?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });

carregarViagem();
carregarChecklist();
