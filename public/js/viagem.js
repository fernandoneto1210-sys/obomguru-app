import { supabase } from "./supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const viagemId = urlParams.get("id");

if (!viagemId) {
  document.getElementById("erroViagem").textContent = "ID da viagem não fornecido.";
  document.getElementById("erroViagem").style.display = "block";
} else {
  carregarViagem();
}

// Carregar dados da viagem
async function carregarViagem() {
  const { data, error } = await supabase
    .from("viagens")
    .select("*")
    .eq("id", viagemId)
    .single();

  if (error || !data) {
    document.getElementById("erroViagem").textContent = "Viagem não encontrada.";
    document.getElementById("erroViagem").style.display = "block";
    return;
  }

  // Preencher dados
  document.getElementById("tituloViagem").textContent = data.titulo;
  document.getElementById("tituloViagemCapa").textContent = data.titulo;
  document.getElementById("datasViagem").textContent = `${formatarData(data.data_inicio)} a ${formatarData(data.data_fim)}`;
  document.getElementById("imgCapaViagem").src = data.imagem_capa || "/img/default-viagem.jpg";
  document.getElementById("roteiroTexto").innerHTML = formatarRoteiro(data.roteiro);
  document.getElementById("dicasViagem").innerHTML = formatarDicas(data.dicas);

  // Link do PDF
  if (data.link_roteiro_pdf) {
    document.getElementById("btnGerarPdfRoteiro").textContent = "📄 Baixar PDF do Roteiro";
    document.getElementById("btnGerarPdfRoteiro").onclick = () => {
      window.open(data.link_roteiro_pdf, "_blank");
    };
  }
}

// Formatar data
function formatarData(data) {
  if (!data) return "";
  const d = new Date(data + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

// Formatar roteiro
function formatarRoteiro(roteiro) {
  if (!roteiro) return "<p>Roteiro não disponível.</p>";
  return roteiro.split("\n").map(linha => `<p>${linha}</p>`).join("");
}

// Formatar dicas
function formatarDicas(dicas) {
  if (!dicas) return "<p>Nenhuma dica disponível no momento.</p>";
  return dicas.split("\n").map(linha => `<p>${linha}</p>`).join("");
}

// CHECKLIST - Atualizar progresso
const checkboxes = document.querySelectorAll(".checklist-item");
const progressText = document.getElementById("checklistProgress");
const progressFill = document.getElementById("progressFill");

function atualizarProgresso() {
  const total = checkboxes.length;
  const marcados = Array.from(checkboxes).filter(cb => cb.checked).length;
  const percentual = (marcados / total) * 100;

  progressText.textContent = `${marcados}/${total}`;
  progressFill.style.width = `${percentual}%`;

  // Salvar no localStorage
  const checklist = {};
  checkboxes.forEach(cb => {
    checklist[cb.dataset.item] = cb.checked;
  });
  localStorage.setItem(`checklist_${viagemId}`, JSON.stringify(checklist));
}

// Carregar checklist salvo
function carregarChecklist() {
  const salvo = localStorage.getItem(`checklist_${viagemId}`);
  if (salvo) {
    const checklist = JSON.parse(salvo);
    checkboxes.forEach(cb => {
      if (checklist[cb.dataset.item]) {
        cb.checked = true;
      }
    });
    atualizarProgresso();
  }
}

checkboxes.forEach(cb => {
  cb.addEventListener("change", atualizarProgresso);
});

carregarChecklist();

// GERAR PDF DO CHECKLIST
document.getElementById("btnGerarChecklistPdf")?.addEventListener("click", async () => {
  const checklist = {};
  checkboxes.forEach(cb => {
    checklist[cb.dataset.item] = cb.checked;
  });

  const total = Object.keys(checklist).length;
  const marcados = Object.values(checklist).filter(v => v).length;
  const tituloViagem = document.getElementById("tituloViagem")?.textContent || "Viagem";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;

  // Título
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Checklist: ${tituloViagem}`, 105, y, { align: "center" });
  y += 15;

  // Progresso
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  doc.text(`Progresso: ${marcados} de ${total} itens concluídos (${Math.round((marcados/total)*100)}%)`, 20, y);
  y += 15;

  // Documentação
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Documentação", 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`${checklist.passaporte ? "✓" : "☐"} Passaporte válido (mínimo 6 meses)`, 25, y); y += 7;
  doc.text(`${checklist.visto ? "✓" : "☐"} Visto (se necessário)`, 25, y); y += 7;
  doc.text(`${checklist.seguro ? "✓" : "☐"} Seguro viagem contratado`, 25, y); y += 7;
  doc.text(`${checklist.carteira ? "✓" : "☐"} Carteira de motorista internacional`, 25, y); y += 7;
  doc.text(`${checklist.comprovantes ? "✓" : "☐"} Comprovantes de reservas`, 25, y); y += 12;

  // Saúde
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Saúde", 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`${checklist.vacinas ? "✓" : "☐"} Vacinas em dia`, 25, y); y += 7;
  doc.text(`${checklist.remedios ? "✓" : "☐"} Remédios de uso contínuo`, 25, y); y += 7;
  doc.text(`${checklist.receitas ? "✓" : "☐"} Receitas médicas`, 25, y); y += 7;
  doc.text(`${checklist.kit ? "✓" : "☐"} Kit de primeiros socorros`, 25, y); y += 12;

  // Bagagem
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Bagagem", 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`${checklist.roupas ? "✓" : "☐"} Roupas adequadas ao clima`, 25, y); y += 7;
  doc.text(`${checklist.calcados ? "✓" : "☐"} Calçados confortáveis`, 25, y); y += 7;
  doc.text(`${checklist.adaptador ? "✓" : "☐"} Adaptador de tomada`, 25, y); y += 7;
  doc.text(`${checklist.carregadores ? "✓" : "☐"} Carregadores e cabos`, 25, y); y += 7;
  doc.text(`${checklist.higiene ? "✓" : "☐"} Itens de higiene pessoal`, 25, y); y += 12;

  // Financeiro
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Financeiro", 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`${checklist.cartao ? "✓" : "☐"} Cartão de crédito internacional`, 25, y); y += 7;
  doc.text(`${checklist.moeda ? "✓" : "☐"} Moeda local`, 25, y); y += 7;
  doc.text(`${checklist.banco ? "✓" : "☐"} Avisar banco sobre viagem`, 25, y); y += 7;
  doc.text(`${checklist.limite ? "✓" : "☐"} Verificar limite do cartão`, 25, y);

  doc.save(`checklist-${tituloViagem.replace(/\s+/g, "-").toLowerCase()}.pdf`);
});

// Botão Sair
document.getElementById("btnSairViagem")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
});
