import { supabase } from "./supabase.js";

const params = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

const bannerEl      = document.getElementById("banner");
const nomeViagemEl  = document.getElementById("nomeViagem");
const datasEl       = document.getElementById("datas");
const roteiroDiasEl = document.getElementById("roteiroDias");
const dicasEl       = document.getElementById("dicas");
const climaEl       = document.getElementById("clima");
const mapaEl        = document.getElementById("mapa");
const linkMapaEl    = document.getElementById("linkMapa");
const linksEl       = document.getElementById("links");
const pdfLinkEl     = document.getElementById("pdfLink");

async function carregarViagem() {
  if (!viagemId) {
    nomeViagemEl.textContent = "Viagem não encontrada (sem ID na URL)";
    return;
  }

  try {
    // 1. Buscar viagem
    const { data: viagem, error: erroViagem } = await supabase
      .from("viagens")
      .select(`
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        dicas,
        clima,
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

    if (erroViagem || !viagem) {
      console.error("Erro ao buscar viagem:", erroViagem);
      nomeViagemEl.textContent = "Erro ao carregar viagem";
      return;
    }

    // 2. Buscar roteiro dia a dia
    const { data: dias, error: erroDias } = await supabase
      .from("roteiro_dias")
      .select("dia, titulo, descricao")
      .eq("viagem_id", viagemId)
      .order("dia", { ascending: true });

    if (erroDias) {
      console.error("Erro ao buscar roteiro_dias:", erroDias);
    }

    preencherBanner(viagem);
    preencherRoteiro(dias || []);
    preencherCards(viagem);

  } catch (err) {
    console.error("Erro inesperado:", err);
    nomeViagemEl.textContent = "Erro ao carregar viagem";
  }
}

function preencherBanner(viagem) {
  nomeViagemEl.textContent = viagem.nome_viagem || "";

  const saida   = formatarData(viagem.data_saida);
  const retorno = formatarData(viagem.data_retorno);
  datasEl.textContent = saida && retorno ? `${saida} → ${retorno}` : "";

  if (viagem.destinos?.imagem_capa_url) {
    bannerEl.style.backgroundImage = `url(${viagem.destinos.imagem_capa_url})`;
  }
}

function preencherRoteiro(dias) {
  if (!dias.length) {
    roteiroDiasEl.innerHTML = "<p>Roteiro dia a dia não cadastrado.</p>";
    return;
  }

  roteiroDiasEl.innerHTML = dias
    .map((d) => {
      const desc = (d.descricao || "").replace(/\n/g, "<br>");
      return `
        <div class="dia-item">
          <div class="dia-titulo">DIA ${d.dia}: ${d.titulo}</div>
          <div class="dia-descricao">${desc}</div>
        </div>
      `;
    })
    .join("");
}

function preencherCards(viagem) {
  // DICAS
  dicasEl.innerHTML = (viagem.dicas || "Sem dicas cadastradas.").replace(/\n/g, "<br>");

  // CLIMA
  climaEl.textContent = viagem.clima || "Informação de clima não cadastrada.";

  // MAPA (link para Google Maps do destino)
  if (viagem.destinos?.nome) {
    const query = encodeURIComponent(`${viagem.destinos.nome}, ${viagem.destinos.pais || ""}`);
    linkMapaEl.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  } else {
    mapaEl.innerHTML = "Mapa não disponível.";
  }

  // LINKS ÚTEIS
  if (!viagem.links_uteis) {
    linksEl.innerHTML = "Nenhum link disponível.";
  } else {
    let lista = [];
    try {
      lista = Array.isArray(viagem.links_uteis)
        ? viagem.links_uteis
        : JSON.parse(viagem.links_uteis);
    } catch (e) {
      console.error("Erro parseando links_uteis:", e);
      linksEl.innerHTML = "Erro ao carregar links.";
      return;
    }

    if (!lista.length) {
      linksEl.innerHTML = "Nenhum link disponível.";
    } else {
      linksEl.innerHTML = lista
        .map(
          (item) =>
            `<a href="${item.url}" target="_blank" rel="noopener" class="card-link">→ ${item.nome}</a>`
        )
        .join("");
    }
  }

  // PDF
  if (viagem.pdf_url) {
    pdfLinkEl.href = viagem.pdf_url;
    pdfLinkEl.style.display = "block";
  } else {
    pdfLinkEl.style.display = "none";
  }
}

function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

carregarViagem();
