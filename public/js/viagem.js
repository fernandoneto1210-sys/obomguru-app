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

  console.log("Carregando viagem:", viagemId);

  const { data: viagem, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  console.log("Viagem:", viagem, "Erro:", error);

  if (error || !viagem) {
    console.error(error);
    if (erroEl) {
      erroEl.textContent = "Viagem não encontrada.";
      erroEl.style.display = "block";
    }
    return;
  }

  if (erroEl) erroEl.style.display = "none";

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

  // ===== IMAGEM DE CAPA (SUPABASE STORAGE) =====
  const capaEl = document.getElementById("capaViagem");
  if (capaEl) {
    // coluna no banco com o NOME DO ARQUIVO no bucket 'imagens'
    // ex: "londres.jpg", "africa-do-sul.jpg", "Punta-Cana-O-que-Fazer-....jpg"
    const caminhoImagem = viagem.imagem_capa; // SE A COLUNA TIVER OUTRO NOME, TROCAR AQUI

    if (caminhoImagem) {
      const { data } = supabase.storage
        .from("imagens")
        .getPublicUrl(caminhoImagem);

      if (data && data.publicUrl) {
        capaEl.style.backgroundImage = `
          linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.65)),
          url('${data.publicUrl}')
        `;
        capaEl.style.backgroundSize = "cover";
        capaEl.style.backgroundPosition = "center";
      } else {
        // fallback – só o gradiente claro
        capaEl.style.backgroundImage = "linear-gradient(135deg, #e8f0f5, #d4e4f0)";
      }
    } else {
      capaEl.style.backgroundImage = "linear-gradient(135deg, #e8f0f5, #d4e4f0)";
    }
  }

  // ===== ROTEIRO DIA A DIA =====
  const roteiroEl = document.getElementById("roteiroTexto");
  if (roteiroEl) {
    const texto = viagem.roteiro_texto;
    if (texto && texto.trim()) {
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
    btnPdfRoteiro.onclick = () =>
      gerarPdfRoteiro(titulo, viagem.roteiro_texto || "");
  }

  // ===== WHATSAPP GUIA (OPCIONAL) =====
  const linkWhats = document.querySelector('a[href*="wa.me"]');
  if (linkWhats && viagem.guia_whatsapp) {
    const numero = viagem.guia_whatsapp.replace(/\D/g, "");
    if (numero) linkWhats.href = `https://wa.me/${numero}`;
  }

  carregarChecklist();
}

// =======================
// PDF DO ROTEIRO (MÚLTIPLAS PÁGINAS)
// =======================
function gerarPdfRoteiro(titulo, roteiro) {
  if (!roteiro || !roteiro.trim()) {
    alert("Roteiro não disponível para gerar PDF.");
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    const marginLeft = 15;
    const marginTop = 20;
    const lineHeight = 6;
    const maxLineWidth = 180;
    const pageHeight = 297;
    const bottomMargin = 20;

    pdf.setFontSize(16);
    pdf.setFont(undefined, "bold");
    pdf.text(titulo, marginLeft, marginTop);

    let y = marginTop + 10;

    pdf.setFontSize(11);
    pdf.setFont(undefined, "normal");

    const linhas = roteiro.split("\n").filter(l => l.trim());

    linhas.forEach(linha => {
      const partes = pdf.splitTextToSize(linha, maxLineWidth);
      partes.forEach(p => {
        if (y + lineHeight > pageHeight - bottomMargin) {
          pdf.addPage();
          y = marginTop;
        }
        pdf.text(p, marginLeft, y);
        y += lineHeight;
      });
      y += 2; // espaço entre parágrafos
    });

    pdf.save(`${titulo.replace(/[^a-z0-9]/gi, "_")}_roteiro.pdf`);
  } catch (e) {
    console.error("Erro ao gerar PDF do roteiro:", e);
    alert("Erro ao gerar PDF do roteiro.");
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
// PDF DO CHECKLIST
// =======================
function gerarPdfChecklist() {
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let y = 15;
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("Checklist da Viagem", 10, y);
    y += 15;

    document.querySelectorAll(".checklist-card").forEach(card => {
      const categoria = card.querySelector("h3").textContent;

      if (y > 270) {
        pdf.addPage();
        y = 15;
      }

      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text(categoria, 10, y);
      y += 10;

      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");

      card.querySelectorAll("label").forEach(label => {
        const cb = label.querySelector("input");
        const marcado = cb.checked ? "[X]" : "[ ]";
        const texto = label.innerText.trim();

        if (y > 280) {
          pdf.addPage();
          y = 15;
        }

        pdf.text(`${marcado} ${texto}`, 15, y);
        y += 7;
      });

      y += 5;
    });

    pdf.save("checklist-viagem.pdf");
  } catch (e) {
    console.error("Erro ao gerar PDF do checklist:", e);
    alert("Erro ao gerar PDF do checklist.");
  }
}

// =======================
// EVENTOS GERAIS
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
carregarViagem();
