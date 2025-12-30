import { supabase } from "./supabase.js";

const viagensGrid = document.getElementById("viagensGrid");

async function carregarViagens() {
  try {
    const { data: viagens, error } = await supabase
      .from("viagens")
      .select(`
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        destino_id,
        destinos (
          nome,
          pais,
          imagem_capa_url
        )
      `)
      .order("data_saida", { ascending: true });

    if (error) {
      console.error("Erro ao carregar viagens:", error);
      viagensGrid.innerHTML = "<div class='loading'>❌ Erro ao carregar viagens</div>";
      return;
    }

    if (!viagens || viagens.length === 0) {
      viagensGrid.innerHTML = "<div class='loading'>Nenhuma viagem disponível no momento.</div>";
      return;
    }

    viagensGrid.innerHTML = viagens
      .map((v) => {
        const saida = formatarData(v.data_saida);
        const retorno = formatarData(v.data_retorno);
        const destino = v.destinos?.nome || "Destino";
        const pais = v.destinos?.pais || "";
        const img = v.destinos?.imagem_capa_url || "";

        return `
          <div class="viagem-card">
            <div class="viagem-img" style="background-image: url('${img}');"></div>
            <div class="viagem-info">
              <h3>${v.nome_viagem}</h3>
              <div class="viagem-destino">
                📍 ${destino}${pais ? `, ${pais}` : ""}
              </div>
              <div class="viagem-datas">
                📅 ${saida} → ${retorno}
              </div>
              <button class="btn-ver" onclick="verDetalhes('${v.id}')">
                Ver Detalhes
              </button>
            </div>
          </div>
        `;
      })
      .join("");

  } catch (err) {
    console.error("Erro inesperado:", err);
    viagensGrid.innerHTML = "<div class='loading'>❌ Erro ao carregar viagens</div>";
  }
}

function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

window.verDetalhes = (id) => {
  window.location.href = `/viagem.html?id=${id}`;
};

window.scrollTo = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

carregarViagens();
