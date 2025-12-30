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
const btnGerarPdf   = document.getElementById("btnGerarPdf");
const cardsSidebar  = document.getElementById("cardsSidebar");

let viagemData = null;
let diasData = [];

// ========================================
// HELPER: Converter URL de imagem para Base64
// ========================================
async function urlToBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao converter imagem para Base64:", error);
    return null;
  }
}

// ========================================
// CARREGAR VIAGEM
// ========================================
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
        moeda,
        tomadas,
        seguranca,
        guia_nome,
        guia_whatsapp,
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

    viagemData = viagem;

    // 2. Buscar roteiro dia a dia
    const { data: dias, error: erroDias } = await supabase
      .from("roteiro_dias")
      .select("dia, titulo, descricao")
      .eq("viagem_id", viagemId)
      .order("dia", { ascending: true });

    if (erroDias) {
      console.error("Erro ao buscar roteiro_dias:", erroDias);
    }

    diasData = dias || [];

    preencherBanner(viagem);
    preencherRoteiro(dias || []);
    preencherCards(viagem);

  } catch (err) {
    console.error("Erro inesperado:", err);
    nomeViagemEl.textContent = "Erro ao carregar viagem";
  }
}

// ========================================
// PREENCHER BANNER
// ========================================
function preencherBanner(viagem) {
  nomeViagemEl.textContent = viagem.nome_viagem || "";

  const saida   = formatarData(viagem.data_saida);
  const retorno = formatarData(viagem.data_retorno);
  datasEl.textContent = saida && retorno ? `${saida} → ${retorno}` : "";

  if (viagem.destinos?.imagem_capa_url) {
    bannerEl.style.backgroundImage = `url(${viagem.destinos.imagem_capa_url})`;
  }
}

// ========================================
// PREENCHER ROTEIRO DIA A DIA
// ========================================
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

// ========================================
// PREENCHER CARDS LATERAIS
// ========================================
function preencherCards(viagem) {
  // DICAS
  dicasEl.innerHTML = (viagem.dicas || "Sem dicas cadastradas.").replace(/\n/g, "<br>");

  // CLIMA (com link para previsão do tempo)
  if (viagem.clima) {
    const cidadeClima = viagem.destinos?.nome || "Londres";
    const paisClima = viagem.destinos?.pais || "Reino Unido";
    const queryClima = encodeURIComponent(`${cidadeClima}, ${paisClima} weather`);
    const linkClima = `https://www.google.com/search?q=${queryClima}`;

    climaEl.innerHTML = `
      <p style="margin-bottom:8px; color:#fff;">${viagem.clima}</p>
      <a href="${linkClima}" target="_blank" rel="noopener" style="font-size:0.88rem;">
        🌤️ Ver previsão completa
      </a>
    `;
  } else {
    climaEl.textContent = "Informação de clima não cadastrada.";
  }

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

  // CARDS ADICIONAIS: MOEDA, TOMADAS, SEGURANÇA
  adicionarCardExtra(viagem.moeda, "💰 MOEDA");
  adicionarCardExtra(viagem.tomadas, "🔌 TOMADAS");
  adicionarCardExtra(viagem.seguranca, "🔒 SEGURANÇA");

  // WHATSAPP DO GUIA
  if (viagem.guia_whatsapp) {
    const numeroLimpo = viagem.guia_whatsapp.replace(/\D/g, "");
    const nomeGuia = viagem.guia_nome || "Guia";
    const linkWhatsapp = `https://wa.me/${numeroLimpo}`;

    const cardWhatsapp = document.createElement("div");
    cardWhatsapp.classList.add("card");
    cardWhatsapp.innerHTML = `
      <h3>💬 FALAR COM O GUIA</h3>
      <p style="margin-bottom:8px;">${nomeGuia}</p>
      <a href="${linkWhatsapp}" target="_blank" rel="noopener">
        Abrir WhatsApp
      </a>
    `;
    cardsSidebar.insertBefore(cardWhatsapp, btnGerarPdf);
  }

  // PDF
  if (viagem.pdf_url) {
    pdfLinkEl.href = viagem.pdf_url;
    pdfLinkEl.style.display = "block";
  } else {
    pdfLinkEl.style.display = "none";
  }
}

// ========================================
// ADICIONAR CARD EXTRA (MOEDA, TOMADAS, SEGURANÇA)
// ========================================
function adicionarCardExtra(conteudo, titulo) {
  if (!conteudo) return;

  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <h3>${titulo}</h3>
    <p>${conteudo.replace(/\n/g, "<br>")}</p>
  `;
  cardsSidebar.insertBefore(card, btnGerarPdf);
}

// ========================================
// FORMATAR DATA (DD/MM/YYYY)
// ========================================
function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ========================================
// GERAR PDF COM IMAGEM (BASE64)
// ========================================
btnGerarPdf.addEventListener("click", async () => {
  if (!viagemData || !diasData.length) {
    alert("Dados da viagem não carregados ainda.");
    return;
  }

  // Mostrar mensagem de carregamento
  btnGerarPdf.textContent = "⏳ GERANDO PDF...";
  btnGerarPdf.disabled = true;

  // Converter imagem para Base64 (se existir)
  let imagemBase64 = null;
  if (viagemData.destinos?.imagem_capa_url) {
    imagemBase64 = await urlToBase64(viagemData.destinos.imagem_capa_url);
  }

  // Montar conteúdo do PDF
  const content = [];

  // Adicionar imagem (se conseguiu converter)
  if (imagemBase64) {
    content.push({
      image: imagemBase64,
      width: 500,
      alignment: "center",
      margin: [0, 0, 0, 20]
    });
  }

  // Adicionar título e datas
  content.push(
    { text: viagemData.nome_viagem, style: "header", alignment: "center" },
    { 
      text: `${formatarData(viagemData.data_saida)} → ${formatarData(viagemData.data_retorno)}`, 
      style: "subheader", 
      alignment: "center" 
    },
    { text: "\n" },
    { text: "ROTEIRO DIA A DIA", style: "sectionTitle" },
    { text: "\n" }
  );

  // Adicionar dias
  diasData.forEach((d) => {
    content.push(
      { text: `DIA ${d.dia}: ${d.titulo}`, style: "diaTitle" },
      { text: d.descricao || "", style: "diaDesc" },
      { text: "\n" }
    );
  });

  // Definição do documento
  const docDefinition = {
    content: content,
    styles: {
      header: { fontSize: 20, bold: true, color: "#27ae60" },
      subheader: { fontSize: 14, italics: true, color: "#555" },
      sectionTitle: { fontSize: 16, bold: true, color: "#2c3e50" },
      diaTitle: { fontSize: 13, bold: true, margin: [0, 10, 0, 5], color: "#34495e" },
      diaDesc: { fontSize: 11, margin: [0, 0, 0, 10], alignment: "justify" }
    },
    pageMargins: [40, 60, 40, 60]
  };

  // Gerar e baixar PDF
  pdfMake.createPdf(docDefinition).download(`roteiro_${viagemData.nome_viagem.replace(/\s+/g, "_")}.pdf`);

  // Restaurar botão
  setTimeout(() => {
    btnGerarPdf.textContent = "📄 GERAR PDF DO ROTEIRO";
    btnGerarPdf.disabled = false;
  }, 1000);
});

// ========================================
// INICIALIZAR
// ========================================
carregarViagem();
