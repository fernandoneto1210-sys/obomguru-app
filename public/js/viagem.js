import { supabase } from "./supabase.js";

// Pegar o ID da viagem da URL
const params = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

// Elementos do HTML (usando os IDs corretos do viagem.html)
const banner = document.getElementById("banner");
const nomeViagem = document.getElementById("nomeViagem");
const destino = document.getElementById("destino");
const datas = document.getElementById("datas");
const descricao = document.getElementById("descricao");
const dicas = document.getElementById("dicas");
const pdfLink = document.getElementById("pdfLink");
const links = document.getElementById("links");

async function carregarViagem() {
  if (!viagemId) {
    if (nomeViagem) nomeViagem.textContent = "Erro: ID da viagem não encontrado na URL";
    return;
  }

  console.log("🔍 Carregando viagem ID:", viagemId);

  try {
    const { data: viagem, error } = await supabase
      .from("viagens")
      .select(`
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        roteiro_texto,
        dicas,
        pdf_url,
        links_uteis,
        destinos (
          nome,
          pais,
          imagem_capa_url
        )
      `)
      .eq("id", viagemId)
      .maybeSingle();

    if (error || !viagem) {
      console.error("❌ Erro ao buscar viagem:", error);
      if (nomeViagem) nomeViagem.textContent = "Erro ao carregar viagem";
      return;
    }

    console.log("✅ Viagem carregada:", viagem);

    // Preencher dados
    if (nomeViagem) {
      nomeViagem.textContent = viagem.nome_viagem || "Viagem";
    }

    if (destino && viagem.destinos) {
      destino.textContent = `${viagem.destinos.nome} - ${viagem.destinos.pais}`;
    }

    if (datas) {
      datas.textContent = `${formatarData(viagem.data_saida)} até ${formatarData(viagem.data_retorno)}`;
    }

    // Banner (imagem de fundo)
    if (banner && viagem.destinos?.imagem_capa_url) {
      banner.style.backgroundImage = `url(${viagem.destinos.imagem_capa_url})`;
    }

    // Roteiro
    if (descricao) {
      descricao.textContent = viagem.roteiro_texto || "Roteiro disponível no PDF abaixo.";
    }

    // Dicas
    if (dicas) {
      dicas.textContent = viagem.dicas || "Nenhuma dica cadastrada ainda.";
    }

    // PDF
    if (pdfLink) {
      if (viagem.pdf_url) {
        pdfLink.href = viagem.pdf_url;
        pdfLink.style.display = "inline-block";
      } else {
        pdfLink.style.display = "none";
      }
    }

    // Links úteis
    if (links) {
      if (viagem.links_uteis) {
        try {
          const listaLinks = JSON.parse(viagem.links_uteis);
          links.innerHTML = listaLinks
            .map(item => `<p><a href="${item.url}" target="_blank">${item.nome}</a></p>`)
            .join("");
        } catch (e) {
          links.innerHTML = "<p>Erro ao carregar links.</p>";
        }
      } else {
        links.innerHTML = "<p>Nenhum link disponível.</p>";
      }
    }

  } catch (erro) {
    console.error("💥 Erro inesperado:", erro);
    if (nomeViagem) nomeViagem.textContent = "Erro ao carregar viagem";
  }
}

function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

carregarViagem();
