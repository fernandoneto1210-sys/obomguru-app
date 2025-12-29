import { supabase } from "./supabase.js";

// Verificar sessão
const idCliente = localStorage.getItem("cliente_id");
const nomeCliente = localStorage.getItem("cliente_nome");

if (!idCliente) {
  window.location.href = "login.html";
}

document.getElementById("nomePassageiro").textContent = nomeCliente;

// logout
window.logout = () => {
  localStorage.clear();
  window.location.href = "login.html";
};

async function carregarViagens() {
  const container = document.getElementById("viagensContainer");

  const { data, error } = await supabase
    .from("clientes_viagens")
    .select(`
      viagens (
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        destinos ( nome, pais, imagem_capa_url )
      )
    `)
    .eq("cliente_id", idCliente);

  if (error) {
    container.innerHTML = "<p>Erro ao carregar viagens.</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Nenhuma viagem encontrada.</p>";
    return;
  }

  container.innerHTML = data
    .map((item) => {
      const v = item.viagens;
      return `
        <div class="viagem-card">
          <img src="${v.destinos.imagem_capa_url}" class="card-img">
          <h4>${v.nome_viagem}</h4>
          <p>${v.destinos.nome} – ${v.destinos.pais}</p>
          <p>${formatar(v.data_saida)} → ${formatar(v.data_retorno)}</p>
        </div>
      `;
    })
    .join("");
}

function formatar(data) {
  if (!data) return "";
  const [y, m, d] = data.split("-");
  return `${d}/${m}/${y}`;
}

carregarViagens();
