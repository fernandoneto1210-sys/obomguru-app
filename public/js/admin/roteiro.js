import { supabase } from "../supabase.js";

const lista = document.getElementById("listaDias");
const viagemId = new URLSearchParams(window.location.search).get("id");

async function carregar() {
  const { data, error } = await supabase
    .from("roteiro_dias")
    .select("*")
    .eq("viagem_id", viagemId)
    .order("dia");

  if (!data.length) {
    lista.innerHTML = "<p>Nenhum dia cadastrado.</p>";
    return;
  }

  lista.innerHTML = data
    .map(
      (d) => `
<div class="card" style="margin-bottom:20px;">
  <h3>DIA ${d.dia}</h3>
  <p><b>${d.titulo}</b></p>
  <p>${d.descricao}</p>

  <button class="btn-secondary" onclick="editarDia('${d.id}')">✏️ Editar</button>
  <button class="btn-danger" onclick="excluirDia('${d.id}')">🗑 Excluir</button>
</div>
`
    )
    .join("");
}

window.adicionarDia = async () => {
  const dia = prompt("Qual número do dia?");
  if (!dia) return;

  const titulo = prompt("Título do dia:");
  const descricao = prompt("Descrição (pode colar texto grande):");

  await supabase.from("roteiro_dias").insert({
    viagem_id: viagemId,
    dia: parseInt(dia),
    titulo,
    descricao
  });

  carregar();
};

window.editarDia = async (id) => {
  const { data } = await supabase
    .from("roteiro_dias")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const novoTitulo = prompt("Título:", data.titulo);
  const novoTexto = prompt("Descrição:", data.descricao);

  await supabase
    .from("roteiro_dias")
    .update({ titulo: novoTitulo, descricao: novoTexto })
    .eq("id", id);

  carregar();
};

window.excluirDia = async (id) => {
  if (!confirm("Excluir este dia?")) return;

  await supabase.from("roteiro_dias").delete().eq("id", id);
  carregar();
};

window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/admin/index.html";
};

carregar();
