import { supabase } from './supabase.js';

async function carregarViagens() {
  const container = document.getElementById('cardsContainer');

  const { data: viagens, error } = await supabase
    .from('viagens')
    .select(`
      id,
      nome_viagem,
      data_saida,
      data_retorno,
      destinos (
        nome,
        pais,
        imagem_capa_url
      )
    `)
    .order('data_saida', { ascending: true });

  if (error) {
    container.innerHTML = "<p>Erro ao carregar viagens.</p>";
    return;
  }

  container.innerHTML = "";

  viagens.forEach((viagem) => {
    const destino = viagem.destinos;

    const img = destino?.imagem_capa_url || "https://via.placeholder.com/600x300?text=Imagem+Indisponivel";

    const card = document.createElement("div");
    card.classList.add("viagem-card");

    card.innerHTML = `
      <img src="${img}" alt="${destino?.nome || "Destino"}">

      <div class="card-content">
        <h3>${viagem.nome_viagem}</h3>
        <p class="card-destino">📍 ${destino?.nome} – ${destino?.pais}</p>
        <p class="card-datas">📅 ${formatar(viagem.data_saida)} → ${formatar(viagem.data_retorno)}</p>

        <a class="btn-card" href="viagem.html?id=${viagem.id}">
          Ver Detalhes
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

function formatar(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

document.addEventListener("DOMContentLoaded", carregarViagens);
