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

  // ===== PDF DO ROTEIRO =====
const btnPdf = document.getElementById("btnGerarPdfRoteiro");
if (btnPdf) {
  btnPdf.onclick = async () => {
    try {
      // Importa jsPDF dinamicamente
      const { jsPDF } = await import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const pdf = new jsPDF();
      const titulo = viagem.nome_viagem || "Roteiro de Viagem";
      const roteiro = viagem.roteiro_texto || "Roteiro não disponível";

      // Título
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(titulo, 10, 15);

      // Datas
      if (viagem.data_saida && viagem.data_retorno) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const saida = formatarData(viagem.data_saida);
        const retorno = formatarData(viagem.data_retorno);
        pdf.text(`${saida} a ${retorno}`, 10, 25);
      }

      // Roteiro
      pdf.setFontSize(11);
      const linhas = pdf.splitTextToSize(roteiro, 180);
      pdf.text(linhas, 10, 35);

      // Download
      pdf.save(`${titulo.replace(/[^a-z0-9]/gi, '_')}_roteiro.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };
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
  ?.addEventListener("click", () => {
    alert("Função de gerar PDF do checklist será implementada.");
  });
document
  .getElementById("btnSairViagem")
  ?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });

// =======================
carregarViagem();
carregarChecklist();


