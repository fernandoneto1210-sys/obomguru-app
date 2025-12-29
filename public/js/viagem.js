import { supabase } from "./supabase.js";

// Pegar o ID da viagem da URL: viagem.html?id=xxxxx
const params = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

// Elementos do HTML
const tituloEl       = document.getElementById("tituloViagem");
const datasEl        = document.getElementById("datasViagem");
const imgCapaEl      = document.getElementById("imgCapaViagem");
const roteiroTextoEl = document.getElementById("roteiroTexto");
const dicasEl        = document.getElementById("dicasViagem");
const linkPdfEl      = document.getElementById("linkRoteiroPdf");
const erroEl         = document.getElementById("erroViagem");

async function carregarViagem() {
  if (!viagemId) {
    if (erroEl) erroEl.textContent = "Viagem não encontrada (sem ID na URL).";
    return;
  }

  try {
    const { data: viagem, error } = await supabase
      .from("viagens")
      .select(`
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        roteiro_texto,
        roteiro_pdf_url,
        dicas,
        destinos (
          nome,
          pais,
          imagem_capa_url
        )
      `)
      .eq("id", viagemId)
      .maybeSingle();

    if (error || !viagem) {
      console.error("Erro ao buscar viagem:", error);
      if (erroEl) erroEl.textContent = "Erro ao carregar viagem";
      return;
    }

    // Título
    if (tituloEl) {
      tituloEl.textContent = viagem.nome_viagem || viagem.destinos?.nome || "Viagem";
    }

    // Imagem de capa
    if (imgCapaEl && viagem.destinos?.imagem_capa_url) {
      imgCapaEl.src = viagem.destinos.imagem_capa_url;
      imgCapaEl.alt = viagem.destinos.nome || viagem.nome_viagem;
    }

    // Datas
    if (datasEl) {
      const saida   = formatarData(viagem.data_saida);
      const retorno = formatarData(viagem.data_retorno);
      datasEl.textContent = saida && retorno ? `${saida} até ${retorno}` : "";
    }

    // Roteiro em texto (se quiser já deixar um resumo aqui)
    if (roteiroTextoEl) {
      roteiroTextoEl.textContent =
        viagem.roteiro_texto ||
        "Roteiro completo disponível no PDF abaixo.";
    }

    // Dicas / observações
    if (dicas) {
      dicasEl.textContent = viagem.dicas || "";
    }

    // Link para PDF
    if (linkPdfEl) {
      if (viagem.roteiro_pdf_url) {
        linkPdfEl.href = viagem.roteiro_pdf_url;
        linkPdfEl.target = "_blank";
      } else {
        linkPdfEl.removeAttribute("href");
        linkPdfEl.textContent = "Roteiro em PDF ainda não disponível.";
      }
    }

    // Se deu tudo certo, some a mensagem de erro
    if (erroEl) erroEl.textContent = "";

  } catch (e) {
    console.error("Erro inesperado ao carregar viagem:", e);
    if (erroEl) erroEl.textContent = "Erro ao carregar viagem";
  }
}

function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

carregarViagem();
