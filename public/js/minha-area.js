import { supabase } from "./supabase.js";

const viagensGrid = document.getElementById("viagensGrid");
const nomeUsuarioEl = document.getElementById("nomeUsuario");

let usuarioId = null;

// ========================
// Verificar autenticação
// ========================
async function verificarAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/login.html";
    return false;
  }

  // Buscar dados do usuário
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("id, nome, tipo")
    .eq("auth_id", session.user.id)
    .maybeSingle();

  if (error || !usuario) {
    console.error("Erro ao buscar usuário:", error);
    window.location.href = "/login.html";
    return false;
  }

  // Se for admin, redirecionar
  if (usuario.tipo === "admin") {
    window.location.href = "/admin/viagens.html";
    return false;
  }

  usuarioId = usuario.id;
  nomeUsuarioEl.textContent = `Bem-vindo, ${usuario.nome}!`;

  return true;
}

// ========================
// Carregar viagens do cliente
// ========================
async function carregarViagens() {
  if (!usuarioId) return;

  try {
    // 1. Buscar IDs das viagens do cliente
    const { data: viagensCliente, error: erroViagensCli } = await supabase
      .from("viagens_clientes")
      .select("viagem_id")
      .eq("usuario_id", usuarioId);

    if (erroViagensCli || !viagensCliente.length) {
      viagensGrid.innerHTML = `
        <div class="sem-viagens">
          <h3>Você ainda não tem viagens inscritas</h3>
          <p>Entre em contato conosco para se inscrever em uma viagem.</p>
        </div>
      `;
      return;
    }

    const viagemIds = viagensCliente.map(v => v.viagem_id);

    // 2. Buscar dados das viagens
    const { data: viagens, error: erroViagens } = await supabase
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
      .in("id", viagemIds)
      .order("data_saida", { ascending: true });

    if (erroViagens || !viagens.length) {
      viagensGrid.innerHTML = `
        <div class="sem-viagens">
          <h3>Erro ao carregar viagens</h3>
          <p>Tente novamente mais tarde.</p>
        </div>
      `;
      return;
    }

    // 3. Renderizar viagens
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
    viagensGrid.innerHTML = `
      <div class="sem-viagens">
        <h3>Erro ao carregar viagens</h3>
        <p>Tente novamente mais tarde.</p>
      </div>
    `;
  }
}

// ========================
// Helpers
// ========================
function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

window.verDetalhes = (id) => {
  window.location.href = `/viagem.html?id=${id}`;
};

window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
};

// ========================
// Inicializar
// ========================
async function inicializar() {
  const autenticado = await verificarAuth();
  if (autenticado) {
    carregarViagens();
  }
}

inicializar();
