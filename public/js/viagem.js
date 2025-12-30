import { supabase } from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

// =======================
// CARREGAR VIAGEM
// =======================
async function carregarViagem() {
  console.log("Carregando viagem:", viagemId);

  const { data: viagem, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  if (error || !viagem) {
    console.error("Erro ao buscar viagem:", error);
    document.getElementById("erroViagem").textContent = "Viagem não encontrada.";
    document.getElementById("erroViagem").style.display = "block";
    return;
  }

  // Título
  const titulo = viagem.nome_viagem || "Viagem";
  document.title = titulo + " | Oficina de Turismo";
  document.getElementById("tituloViagem").textContent = titulo;
  document.getElementById("tituloViagemCapa").textContent = titulo;

  // Datas
  if (viagem.data_saida && viagem.data_retorno) {
    const saida = formatarData(viagem.data_saida);
    const retorno = formatarData(viagem.data_retorno);
    document.getElementById("datasViagem").textContent = `${saida} a ${retorno}`;
  }

  // Capas — NÃO ENCOSTO AGORA (pra não quebrar nada)
  const capaEl = document.getElementById("capaViagem");
  capaEl.style.backgroundImage = "linear-gradient(135deg, #e8f0f5, #d4e4f0)";

  // ROTEIRO
  const roteiroTexto = document.getElementById("roteiroTexto");
  if (viagem.roteiro_texto && viagem.roteiro_texto.trim().length > 0) {
    roteiroTexto.innerHTML = viagem.roteiro_texto
      .split("\n")
      .map(l => `<p>${l.trim()}</p>`)
      .join("");
  } else {
    roteiroTexto.innerHTML = "<p>Roteiro não disponível.</p>";
  }

  // DICAS
  const dicasEl = document.getElementById("dicasViagem");
  dicasEl.innerHTML = "";

  if (viagem.dicas && viagem.dicas.trim()) {
    dicasEl.innerHTML += `
      <div class="dica-box">
        <h3>Informações Gerais</h3>
        ${viagem.dicas.split("\n").map(l => `<p>${l}</p>`).join("")}
      </div>
    `;
  }

  if (viagem.informacoes_uteis && viagem.informacoes_uteis.trim()) {
    dicasEl.innerHTML += `
      <div class="dica-box">
        <h3>Informações Úteis</h3>
        ${viagem.informacoes_uteis.split("\n").map(l => `<p>${l}</p>`).join("")}
      </div>
    `;
  }

  // PDF — funcionando como antes
  document.getElementById("btnGerarPdfRoteiro").onclick = () => {
    gerarPdfRoteiro(titulo, viagem.roteiro_texto);
  };

  carregarChecklist();
}

function formatarData(valor) {
  const d = new Date(valor + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

// =======================
// PDF DO ROTEIRO (VERSÃO QUE FUNCIONAVA)
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

  pdf.setFontSize(11);
  const linhas = pdf.splitTextToSize(roteiro, 180);
  pdf.text(linhas, 10, 30);

  pdf.save(`${titulo.replace(/[^a-z0-9]/gi, "_")}_roteiro.pdf`);
}

// =======================
// CHECKLIST
// =======================
function salvarChecklist() {
  const itens = {};
  document.querySelectorAll(".checklist-item").forEach(cb => {
    itens[cb.dataset.item] = cb.checked;
  });
  localStorage.setItem("checklist_" + viagemId, JSON.stringify(itens));
}

function carregarChecklist() {
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

document.getElementById("btnGerarChecklistPdf")?.addEventListener("click", gerarPdfChecklist);

// =======================
carregarViagem();
