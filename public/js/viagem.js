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

  // 1. Buscar dados gerais da viagem
  const { data: viagem, error: erroViagem } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  console.log("📦 Dados da viagem:", viagem);

  if (erroViagem || !viagem) {
    console.error("❌ Erro ao buscar viagem:", erroViagem);
    const erroEl = document.getElementById("erroViagem");
    if (erroEl) {
      erroEl.textContent = "Viagem não encontrada.";
      erroEl.style.display = "block";
    }
    return;
  }

  // 2. Buscar roteiro dia a dia da tabela roteiro_dias
  const { data: dias, error: erroDias } = await supabase
    .from("roteiro_dias")
    .select("*")
    .eq("viagem_id", viagemId)
    .order("numero_dia", { ascending: true });

  console.log("📅 Dias do roteiro:", dias);

  // ===== TÍTULO =====
  const titulo = viagem.nome_viagem || "Viagem";
  const tituloPage = document.getElementById("tituloViagem");
  const tituloCapa = document.getElementById("tituloViagemCapa");

  if (tituloPage) tituloPage.textContent = titulo;
  if (tituloCapa) tituloCapa.textContent = titulo;

  // ===== DATAS =====
  const datasEl = document.getElementById("datasViagem");
  if (datasEl) {
    if (viagem.data_saida && viagem.data_retorno) {
      const saida = formatarData(viagem.data_saida);
      const retorno = formatarData(viagem.data_retorno);
      datasEl.textContent = `${saida} a ${retorno}`;
    } else {
      datasEl.textContent = "";
    }
  }

  // ===== IMAGEM DE CAPA =====
  const imgEl = document.getElementById("imgCapaViagem");
  if (imgEl) {
    // Por enquanto usa imagem padrão
    // Depois você pode adicionar coluna imagem_capa na tabela viagens
    imgEl.src = "/img/logo.png"; // ou qualquer imagem padrão
    imgEl.alt = titulo;
  }

  // ===== ROTEIRO DIA A DIA =====
  const roteiroEl = document.getElementById("roteiroTexto");
  if (roteiroEl) {
    if (dias && dias.length > 0) {
      // Montar o roteiro a partir da tabela roteiro_dias
      const htmlRoteiro = dias
        .map((dia) => {
          return `
            <div class="dia-roteiro">
              <h3>${dia.numero_dia}° Dia ${dia.data_dia ? "- " + formatarData(dia.data_dia) : ""}</h3>
              <p>${dia.descricao || ""}</p>
            </div>
          `;
        })
        .join("");
      roteiroEl.innerHTML = htmlRoteiro;
    } else if (viagem.roteiro_texto && viagem.roteiro_texto.trim().length > 0) {
      // Fallback: se não tiver na tabela roteiro_dias, usa roteiro_texto
      roteiroEl.innerHTML = viagem.roteiro_texto
        .split("\n")
        .filter((linha) => linha.trim().length > 0)
        .map((linha) => `<p>${linha}</p>`)
        .join("");
    } else {
      roteiroEl.innerHTML = "<p>Roteiro não disponível.</p>";
    }
  }

  // ===== DICAS =====
  const dicasEl = document.getElementById("dicasViagem");
  if (dicasEl) {
    let blocos = [];

    if (viagem.dicas && viagem.dicas.trim().length > 0) {
      blocos.push(
        viagem.dicas
          .split("\n")
          .filter((l) => l.trim().length > 0)
          .map((l) => `<p>${l}</p>`)
          .join("")
      );
    }

    if (viagem.informacoes_uteis && viagem.informacoes_uteis.trim().length > 0) {
      blocos.push(
        "<h3>Informações Úteis</h3>" +
          viagem.informacoes_uteis
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((l) => `<p>${l}</p>`)
            .join("")
      );
    }

    if (blocos.length === 0) {
      dicasEl.innerHTML = "<p>Dicas ainda não cadastradas.</p>";
    } else {
      dicasEl.innerHTML = blocos.join("");
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

  // ===== WHATSAPP DO GUIA =====
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
  if (isNaN(d.getTime())) {
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

document.querySelectorAll(".checklist-item").forEach((cb) => {
  cb.addEventListener("change", salvarChecklist);
});

// =======================
// BOTÃO PDF CHECKLIST
// =======================
document
  .getElementById("btnGerarChecklistPdf")
  ?.addEventListener("click", () => {
    alert("Função de gerar PDF do checklist será implementada.");
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
