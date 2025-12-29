import { supabase } from "./supabase.js";

// pegar o ID da URL
const url = new URLSearchParams(window.location.search);
const idViagem = url.get("id");

// elementos
const nomeViagem = document.getElementById("nomeViagem");
const destino = document.getElementById("destino");
const datas = document.getElementById("datas");
const banner = document.getElementById("banner");
const descricao = document.getElementById("descricao");
const dicas = document.getElementById("dicas");
const links = document.getElementById("links");
const pdfLink = document.getElementById("pdfLink");

async function carregarViagem() {
  const { data, error } = await supabase
    .from("viagens")
    .select(`
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
    .eq("id", idViagem)
    .single();

  if (error) {
    console.error(error);
    nomeViagem.textContent = "Erro ao carregar viagem";
    return;
  }

  // dados principais
  nomeViagem.textContent = data.nome_viagem;
  destino.textContent = `${data.destinos.nome} – ${data.destinos.pais}`;
  datas.textContent = `${formatar(data.data_saida)} até ${formatar(data.data_retorno)}`;
  banner.style.backgroundImage = `url(${data.destinos.imagem_capa_url})`;

  // textos
  descricao.textContent = data.roteiro_texto || "Roteiro não informado.";
  dicas.textContent = data.dicas || "Nenhuma dica cadastrada.";

  // pdf
  if (data.pdf_url) {
    pdfLink.href = data.pdf_url;
  } else {
    pdfLink.style.display = "none";
  }

  // links úteis
  if (data.links_uteis) {
    const lista = JSON.parse(data.links_uteis);
    links.innerHTML = lista
      .map(item => `<p><a href="${item.url}" target="_blank">${item.nome}</a></p>`)
      .join("");
  } else {
    links.innerHTML = "<p>Nenhum link disponível.</p>";
  }
}

function formatar(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

carregarViagem();
