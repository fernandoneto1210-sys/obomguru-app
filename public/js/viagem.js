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

  console.log("📦 Dados da viagem vindos do Supabase:", data);

  const erroEl = document.getElementById("erroViagem");

  if (error || !data) {
    console.error("❌ Erro ao buscar viagem:", error);
    if (erroEl) {
      erroEl.textContent = "Viagem não encontrada.";
      erroEl.style.display = "block";
    }
    return;
  }

  // ===== TÍTULO =====
  const titulo = data.nome_viagem || "Viagem";
  const tituloPage = document.getElementById("tituloViagem");
  const tituloCapa = documentElementById("tituloViagemCapa");

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
      console.warn("⚠️ data_saida ou data_retorno não vieram do banco:", {
        data_saida: data.data_saida,
        data_retorno: data.data_retorno,
      });
      datasEl.textContent = "";
    }
  }

  // ===== IMAGEM DE CAPA =====
  // Você ainda não tem coluna de imagem; use uma padrão
  const imgEl = document.getElementById("imgCapaViagem");
  if (imgEl) {
    imgEl.src = "/img/default-viagem.jpg"; // troque quando criar imagem_capa
    imgEl.alt = titulo;
  }

  // ===== ROTEIRO DIA A DIA (texto igual ao PDF) =====
  const roteiroEl = document.getElementById("roteiro");
  if (roteiroEl) {
    const roteiro = data.roteiro_texto;

    if (roteiro && roteiro.trim().length > 0) {
      roteiroEl.innerHTML = roteiro
        .split("\n")
        .filter((linha) => linha.trim().length > 0)
        .map((linha) => `<p>${linha}</p>`)
        .join("");
    } else {
      console.warn("⚠️ roteiro_texto vazio ou ausente.");
      roteiroEl.innerHTML = "<p>Roteiro não disponível.</p>";
    }
  }

  // ===== DICAS / INFORMAÇÕES ÚTEIS =====
  const dicasEl = document.getElementById("dicasViagem");
  if (dicasEl) {
    let blocos = [];

    if (data.dicas && data.dicas.trim().length > 0) {
      blocos.push(
        "<h3>Dicas Gerais</h3>" +
          data.dicas
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((l) => `<p>${l}</p>`)
            .join("")
      );
    }

    if (data.informacoes_uteis && data.informacoes_uteis.trim().length > 0) {
      blocos.push(
        "<h3>Informações Úteis</h3>" +
          data.informacoes_uteis
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((l) => `<p>${l}</p>`)
            .join("")
      );
    }

    if (data.moeda) {
      blocos.push(`<p><strong>Moeda local:</strong> ${data.moeda}</p>`);
    }

    if (data.tomadas) {
      blocos.push(`<p><strong>Tomadas:</strong> ${data.tomadas}</p>`);
    }

    if (data.seguranca) {
      blocos.push(`<p><strong>Segurança:</strong> ${data.seguranca}</p>`);
    }

    if (blocos.length === 0) {
      dicasEl.innerHTML = "<p>Dicas ainda não cadastradas.</p>";
    } else {
      dicasEl.innerHTML = blocos.join("<hr />");
    }
  }

  // ===== BOTÃO PDF DO ROTEIRO =====
  const btnPdf = document.getElementById("btnGerarPdfRoteiro");
  if (btnPdf) {
    if (data.pdf_url) {
      btnPdf.textContent = "📄 Baixar PDF do Roteiro";
      btnPdf.onclick = () => window.open(data.pdf_url, "_blank");
    } else {
      btnPdf.style.display = "none"; // se não tiver pdf_url, esconde
    }
  }

  // ===== WHATSAPP DO GUIA (se existir) =====
  const linkWhats = document.querySelector('a[href*="wa.me"]');
  if (linkWhats && data.guia_whatsapp) {
    const numero = data.guia_whatsapp.replace(/\D/g, "");
    if (numero) {
      linkWhats.href = `https://wa.me/${numero}`;
    }
  }

  // ===== MAPA / CLIMA OPCIONAIS =====
  const linkClima = document.getElementById("linkClima");
  if (linkClima && data.clima && data.clima.startsWith("http")) {
    linkClima.href = data.clima;
  }

  const linkMapaCard = document.querySelector('a[href*="google.com/maps"]');
  if (linkMapaCard && data.mapa_url && data.mapa_url.startsWith("http")) {
    linkMapaCard.href = data.mapa_url;
  }
}

function formatarData(valor) {
  if (!valor) return "";
  const d = new Date(valor + "T00:00:00");
  if (isNaN(d.getTime())) {
    console.warn("⚠️ Data inválida recebida:", valor);
    return "";
  }
  return d.toLocaleDateString("pt-BR");
}

// =======================
// CHECKLIST (já no HTML)
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
// BOTÃO PDF CHECKLIST (depois implementamos o PDF)
// =======================
document
  .getElementById("btnGerarChecklistPdf")
  ?.addEventListener("click", () => {
    alert("Depois vamos gerar o PDF do checklist aqui.");
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
