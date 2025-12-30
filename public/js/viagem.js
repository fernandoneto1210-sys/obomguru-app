import { supabase } from "./supabase.js";

const params   = new URLSearchParams(window.location.search);
const viagemId = params.get("id");

const bannerEl      = document.getElementById("banner");
const nomeViagemEl  = document.getElementById("nomeViagem");
const datasEl       = document.getElementById("datas");
const roteiroDiasEl = document.getElementById("roteiroDias");
const dicasEl       = document.getElementById("dicas");
const climaEl       = document.getElementById("clima");
const mapaEl        = document.getElementById("mapa");
const linksEl       = document.getElementById("links");
const pdfLinkEl     = document.getElementById("pdfLink");

async function carregarViagem() {
  if (!viagemId) {
    nomeViagemEl.textContent = "Viagem não encontrada (sem ID)";
    return;
  }

  try {
    // 1) Buscar viagem
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

    // 2) Buscar roteiro dia a dia
    const { data: dias, error: erroDias } = await supabase
      .from("roteiro_dias")
      .select("dia, titulo, descricao")
      .eq("viagem_id", viagemId)
      .order("dia", { ascending: true });

    if (erroDias) {
      console.error("Erro ao buscar roteiro_dias:", erroDias);
    }

    montarCabecalho(viagem);
    montarRoteiro(dias || []);
    montarCards(viagem);

  } catch (e) {
    console.error("Erro inesperado:", e);
    nomeViagemEl.textContent = "Erro ao carregar viagem";
  }
}

function montarCabecalho(viagem) {
  nomeViagemEl.textContent = viagem.nome_viagem || "";

  const saida   = formatarData(viagem.data_saida);
  const retorno = formatarData(viagem.data_retorno);
  datasEl.textContent = saida && retorno ? `${saida} → ${retorno}` : "";

  if (viagem.destinos && viagem.destinos.imagem_capa_url) {
    bannerEl.style.backgroundImage = `url(${viagem.destinos.imagem_capa_url})`;
  }
}

function montarRoteiro(dias) {
  if (!dias.length) {
    roteiroDiasEl.innerHTML = "<p>Roteiro dia a dia não cadastrado.</p>";
    return;
  }

  roteiroDiasEl.innerHTML = dias
    .map(d => {
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

function montarCards(viagem) {
  // Dicas
  if (viagem.dicas) {
    dicasEl.innerHTML = viagem.dicas.replace(/\n/g, "<br>");
  } else {
    dicasEl.textContent = "Nenhuma dica cadastrada.";
  }

  // Clima
  if (viagem.clima) {
    climaEl.textContent = viagem.clima;
  } else {
    climaEl.textContent = "Informação de clima não cadastrada.";
  }

  // Mapa – por enquanto apenas texto, depois podemos trocar por iframe
  mapaEl.innerHTML = "<p>Mapa da rota será adicionado aqui em breve.</p>";

  // Links úteis
  if (!viagem.links_uteis) {
    linksEl.innerHTML = "<p>Nenhum link disponível.</p>";
  } else {
    let lista = [];
    try {
      lista = Array.isArray(viagem.links_uteis)
        ? viagem.links_uteis
        : JSON.parse(viagem.links_uteis);
    } catch (e) {
      console.error("Erro ao parsear links_uteis:", e);
      linksEl.innerHTML = "<p>Erro ao carregar links.</p>";
      return;
    }

    if (!lista.length) {
      linksEl.innerHTML = "<p>Nenhum link disponível.</p>";
    } else {
      linksEl.innerHTML = lista        .map(
          item =>
            `<p><a href="${item.url}" target="_blank" rel="noopener">${item.nome}</a></p>`
        )
        .join("");
    }
  }

  // PDF – só mostra botão se houver URL
  if (viagem.pdf_url) {
    pdfLinkEl.href = viagem.pdf_url;
    pdfLinkEl.style.display = "inline-block";
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
