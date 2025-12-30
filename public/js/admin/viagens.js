import { supabase } from "../supabase.js";

const listaDiv = document.getElementById("listaViagens");

async function carregar() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "/admin/index.html";
    return;
  }

  const { data, error } = await supabase
    .from("viagens")
    .select(`
      id,
      nome_viagem,
      data_saida,
      data_retorno,
      destinos (nome, imagem_capa_url)
    `)
    .order("data_saida", { ascending: false });

  if (error) {
    listaDiv.innerHTML = "<p>Erro ao carregar viagens.</p>";
    return;
  }

  if (!data.length) {
    listaDiv.innerHTML = "<p>Nenhuma viagem cadastrada.</p>";
    return;
  }

  listaDiv.innerHTML = data
    .map(
      (v) => `
<div class="viagem-card" style="display:flex; gap:20px; padding:15px;">
  <div class="viagem-img" style="
    width:180px; height:120px; border-radius:12px;
    background-size:cover; background-position:center;
    background-image:url('${v.destinos?.imagem_capa_url || ""}');
  "></div>

  <div style="flex:1;">
    <h3>${v.nome_viagem}</h3>
    <p>${v.data_saida} → ${v.data_retorno}</p>

    <button class="btn-secondary" onclick="editar('${v.id}')">✏️ Editar</button>
    <button class="btn-secondary" onclick="roteiro('${v.id}')">📅 Roteiro</button>
    <button class="btn-danger" onclick="excluir('${v.id}')">🗑 Excluir</button>
  </div>
</div>
`
    )
    .join("");
}

window.criarViagem = () => {
  window.location.href = "/admin/editar-viagem.html";
};

window.editar = (id) => {
  window.location.href = `/admin/editar-viagem.html?id=${id}`;
};

window.roteiro = (id) => {
  window.location.href = `/admin/editar-roteiro.html?id=${id}`;
};

window.excluir = async (id) => {
  if (!confirm("Deseja realmente excluir esta viagem?")) return;

  await supabase.from("roteiro_dias").delete().eq("viagem_id", id);
  await supabase.from("viagens").delete().eq("id", id);

  carregar();
};

window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/admin/index.html";
};

carregar();
