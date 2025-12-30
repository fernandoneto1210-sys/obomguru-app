import { supabase } from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

const erroEl = document.getElementById("erroViagem");

if (!viagemId && erroEl) {
  erroEl.textContent = "ID da viagem não informado.";
  erroEl.style.display = "block";
}

// =======================
// FORMATAÇÃO DE DATA
// =======================
function formatarData(valor) {
  if (!valor) return "";
  const d = new Date(valor + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

// =======================
// CARREGAR VIAGEM
// =======================
async function carregarViagem() {
  if (!viagemId) return;

  const { data: viagem, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  if (error || !viagem) {
    console.error(error);
    if (erroEl) {
      erroEl.textContent = "Viagem não encontrada.";
      erroEl.style.display = "block";
    }
    return;
  }
  if (erroEl) erroEl.style.display = "none";
  // ===== METRÔ - LINKS POR CIDADE =====
const linkMetro = document.getElementById("linkMetro");

if (linkMetro) {
  const nome = (viagem.nome_viagem || "").toLowerCase();

  if (nome.includes("londres") || nome.includes("inglaterra")) {
    linkMetro.href = "https://tfl.gov.uk/maps/track/tube";
  } 
  else if (nome.includes("paris")) {
    linkMetro.href = "https://www.ratp.fr/en/plan-metro";
  }
  else if (nome.includes("nova york") || nome.includes("new york")) {
    linkMetro.href = "https://new.mta.info/maps/subway";
  }
  else if (nome.includes("madrid")) {
    linkMetro.href = "https://www.metromadrid.es/en/map";
  }
  else if (nome.includes("berlim") || nome.includes("berlin")) {
    linkMetro.href = "https://www.bvg.de/en/tickets-and-fares/overview-metro-map";
  }
  else {
    // Se a cidade não tiver metrô
    linkMetro.href = "https://www.google.com/search?q=metro+da+cidade";
  }
}


  // ===== TÍTULO =====
  const titulo = viagem.nome_viagem || "Viagem";
  document.title = `${titulo} | Oficina de Turismo`;

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

  // ===== IMAGEM DE CAPA (USANDO LINK DIRETO DO BANCO) =====
  const capaEl = document.getElementById("capaViagem");
  if (capaEl) {
    const urlDireta = viagem.imagem_capa;

    if (urlDireta && urlDireta.startsWith("http")) {
      capaEl.style.backgroundImage = `
        linear-gradient(rgba(0,0,0,0.30), rgba(0,0,0,0.65)),
        url('${urlDireta}')
      `;
      capaEl.style.backgroundSize = "cover";
      capaEl.style.backgroundPosition = "center center";
    } else {
      capaEl.style.backgroundImage = "linear-gradient(135deg, #e8f0f5, #d4e4f0)";
    }
  }

  // ===== ROTEIRO DIA A DIA =====
  const roteiroEl = document.getElementById("roteiroTexto");
  if (roteiroEl) {
    const texto = viagem.roteiro_texto;
    if (texto && texto.trim()) {
      // Divide por linhas e cria parágrafos
      const linhas = texto
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

      roteiroEl.innerHTML = linhas
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

    if (viagem.dicas && viagem.dicas.trim()) {
      dicasEl.innerHTML += `
        <div class="dica-box">
          <h3>Informações Gerais</h3>
          ${viagem.dicas
            .split("\n")
            .filter(l => l.trim())
            .map(l => `<p>${l}</p>`)
            .join("")}
        </div>
      `;
    }

    if (viagem.informacoes_uteis && viagem.informacoes_uteis.trim()) {
      dicasEl.innerHTML += `
        <div class="dica-box">
          <h3>Informações Úteis</h3>
          ${viagem.informacoes_uteis
            .split("\n")
            .filter(l => l.trim())
            .map(l => `<p>${l}</p>`)
            .join("")}
        </div>
      `;
    }

    if (!viagem.dicas && !viagem.informacoes_uteis) {
      dicasEl.innerHTML = "<p>Nenhuma dica cadastrada.</p>";
    }
  }

  // ===== BOTÃO PDF DO ROTEIRO =====
  const btnPdfRoteiro = document.getElementById("btnGerarPdfRoteiro");
  if (btnPdfRoteiro) {
    btnPdfRoteiro.onclick = () => {
      gerarPdfRoteiro(titulo, viagem.roteiro_texto || "");
    };
  }

  carregarChecklist();
}

// =======================
// GERAR PDF DO ROTEIRO
// =======================
function gerarPdfRoteiro(titulo, roteiro) {
  if (!roteiro || !roteiro.trim()) {
    alert("Roteiro não disponível para gerar PDF.");
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 20;
    const marginBottom = 20;
    const lineHeight = 7;
    const maxWidth = pageWidth - marginLeft - marginRight;

    let yPosition = marginTop;

    // TÍTULO
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text(titulo, marginLeft, yPosition);
    yPosition += 15;

    // ROTEIRO
    pdf.setFontSize(11);
    pdf.setFont(undefined, "normal");

    const linhas = roteiro
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);

    linhas.forEach((linha, index) => {
      // Quebra o texto em múltiplas linhas se necessário
      const textosQuebrados = pdf.splitTextToSize(linha, maxWidth);

      textosQuebrados.forEach((texto) => {
        // Se passou do limite da página, cria nova página
        if (yPosition + lineHeight > pageHeight - marginBottom) {
          pdf.addPage();
          yPosition = marginTop;
        }

        pdf.text(texto, marginLeft, yPosition);
        yPosition += lineHeight;
      });

      // Espaço entre parágrafos
      yPosition += 3;
    });

    // Salva o PDF
    const nomeArquivo = `${titulo.replace(/[^a-z0-9]/gi, "_")}_roteiro.pdf`;
    pdf.save(nomeArquivo);

  } catch (erro) {
    console.error("Erro ao gerar PDF:", erro);
    alert("Erro ao gerar PDF do roteiro. Tente novamente.");
  }
}

// =======================
// CHECKLIST – LOCALSTORAGE
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

// =======================
// PDF CHECKLIST
// =======================
function gerarPdfChecklist() {
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginBottom = 20;
    let yPosition = 15;

    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("Checklist da Viagem", marginLeft, yPosition);
    yPosition += 15;

    document.querySelectorAll(".checklist-card").forEach(card => {
      const categoria = card.querySelector("h3").textContent;

      if (yPosition > pageHeight - marginBottom - 10) {
        pdf.addPage();
        yPosition = 15;
      }

      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text(categoria, marginLeft, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");

      card.querySelectorAll("label").forEach(label => {
        const cb = label.querySelector("input");
        const marcado = cb.checked ? "[X]" : "[ ]";
        const texto = label.innerText.trim();

        if (yPosition > pageHeight - marginBottom) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.text(`${marcado} ${texto}`, marginLeft + 5, yPosition);
        yPosition += 7;
      });

      yPosition += 5;
    });

    pdf.save("checklist-viagem.pdf");

  } catch (erro) {
    console.error("Erro ao gerar PDF do checklist:", erro);
    alert("Erro ao gerar PDF do checklist.");
  }
}

// =======================
// EVENTOS
// =======================
document
  .getElementById("btnGerarChecklistPdf")
  ?.addEventListener("click", gerarPdfChecklist);

document.querySelectorAll(".checklist-item").forEach(cb => {
  cb.addEventListener("change", salvarChecklist);
});

document.getElementById("btnSairViagem")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
});

// =======================
// INICIAR
// =======================
carregarViagem();

