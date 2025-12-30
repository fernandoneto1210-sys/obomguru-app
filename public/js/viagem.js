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
    .select(`
      *,
      destinos (
        nome,
        imagem_url
      )
    `)
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

  // ===== IMAGEM DE CAPA (DA TABELA DESTINOS) =====
  const capaEl = document.getElementById("capaViagem");
  if (capaEl && viagem.destinos && viagem.destinos.imagem_url) {
    capaEl.style.backgroundImage = `url(${viagem.destinos.imagem_url})`;
    capaEl.style.backgroundSize = "cover";
    capaEl.style.backgroundPosition = "center";
  }

  // ===== ROTEIRO DIA A DIA =====
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

  // ===== DICAS =====
  const dicasEl = document.getElementById("dicasViagem");
  if (dicasEl) {
    dicasEl.innerHTML = "";

    if (viagem.dicas && viagem.dicas.trim().length > 0) {
      dicasEl.innerHTML += `
        <div class="dica-box">
          <h3>Informações Gerais</h3>
          ${viagem.dicas.split("\n").filter(l => l.trim()).map(l => `<p>${l}</p>`).join("")}
        </div>
      `;
    }

    if (viagem.informacoes_uteis && viagem.informacoes_uteis.trim().length > 0) {
      dicasEl.innerHTML += `
        <div class="dica-box">
          <h3>Informações Úteis</h3>
          ${viagem.informacoes_uteis.split("\n").filter(l => l.trim()).map(l => `<p>${l}</p>`).join("")}
        </div>
      `;
    }

    if (!viagem.dicas && !viagem.informacoes_uteis) {
      dicasEl.innerHTML = "<p>Nenhuma dica cadastrada.</p>";
    }
  }

  // ===== BOTÃO PDF DO ROTEIRO =====
  const btnPdf = document.getElementById("btnGerarPdfRoteiro");
  if (btnPdf) {
    if (viagem.pdf_url) {
      btnPdf.textContent = "📄 Baixar PDF do Roteiro";
      btnPdf.onclick = () => window.open(viagem.pdf_url, "_blank");
    } else {
      // Gerar PDF do roteiro
      btnPdf.onclick = () => gerarPdfRoteiro(titulo, viagem.roteiro_texto);
    }
  }

  // ===== WHATSAPP GUIA =====
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
// GERAR PDF DO ROTEIRO
// =======================
function gerarPdfRoteiro(titulo, roteiro) {
  if (!roteiro || roteiro.trim().length === 0) {
    alert("Roteiro não disponível para gerar PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(18);
  pdf.text(titulo, 10, 15);

  pdf.setFontSize(12);
  const linhas = pdf.splitTextToSize(roteiro, 180);
  pdf.text(linhas, 10, 30);

  pdf.save(`${titulo}-roteiro.pdf`);
}

// =======================
// GERAR PDF DO CHECKLIST
// =======================
function gerarPdfChecklist() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(18);
  pdf.text("Checklist da Viagem", 10, 15);

  pdf.setFontSize(12);
  let y = 30;

  document.querySelectorAll(".checklist-card").forEach(card => {
    const categoria = card.querySelector("h3").textContent;
    pdf.setFont(undefined, "bold");
    pdf.text(categoria, 10, y);
    y += 8;

    pdf.setFont(undefined, "normal");
    card.querySelectorAll("label").forEach(label => {
      const checkbox = label.querySelector(".checklist-item");
      const texto = label.textContent.trim();
      const marcado = checkbox.checked ? "[X]" : "[ ]";
      pdf.text(`${marcado} ${texto}`, 15, y);
      y += 6;
    });

    y += 5;
  });

  pdf.save("checklist-viagem.pdf");
}

// =======================
// CHECKLIST
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
  ?.addEventListener("click", gerarPdfChecklist);

document
  .getElementById("btnSairViagem")
  ?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });

// =======================
carregarViagem();
carregarChecklist();
