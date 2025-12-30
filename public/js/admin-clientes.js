import { supabase } from "./supabase.js";

let viagensDisponiveis = [];

// Verificar autenticação
async function verificarAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!usuario || usuario.tipo !== "admin") {
    alert("Acesso negado. Apenas administradores.");
    window.location.href = "/login.html";
  }
}

// Carregar viagens para o select
async function carregarViagens() {
  const { data, error } = await supabase
    .from("viagens")
    .select("id, titulo")
    .order("titulo");

  if (!error && data) {
    viagensDisponiveis = data;
    const select = document.getElementById("clienteViagem");
    data.forEach(v => {
      const option = document.createElement("option");
      option.value = v.id;
      option.textContent = v.titulo;
      select.appendChild(option);
    });
  }
}

// Carregar clientes
async function carregarClientes() {
  const container = document.getElementById("listaClientes");
  container.innerHTML = "<p>Carregando clientes...</p>";

  const { data, error } = await supabase
    .from("usuarios")
    .select(`
      id,
      nome,
      email,
      telefone,
      tipo,
      viagem_id,
      viagens (
        titulo
      )
    `)
    .eq("tipo", "cliente")
    .order("nome");

  if (error) {
    console.error("Erro ao carregar clientes:", error);
    container.innerHTML = "<p class='error'>Erro ao carregar clientes.</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Nenhum cliente cadastrado ainda.</p>";
    return;
  }

  container.innerHTML = data.map(c => `
    <div class="cliente-card">
      <div class="card-header">
        <h3>${c.nome}</h3>
        <span class="badge ${c.viagem_id ? 'badge-success' : 'badge-warning'}">
          ${c.viagem_id ? '✓ Vinculado' : '⚠ Sem viagem'}
        </span>
      </div>
      <div class="card-body">
        <p><strong>📧 Email:</strong> ${c.email}</p>
        ${c.telefone ? `<p><strong>📱 Telefone:</strong> ${c.telefone}</p>` : ""}
        <p><strong>🌍 Viagem:</strong> ${c.viagens?.titulo || "Nenhuma viagem vinculada"}</p>
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-secondary" onclick="editarCliente('${c.id}')">✏️ Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirCliente('${c.id}', '${c.nome.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
      </div>
    </div>
  `).join("");
}

// Abrir modal
function abrirModal(clienteId = null) {
  const modal = document.getElementById("modalCliente");
  const titulo = document.getElementById("modalTitulo");
  const form = document.getElementById("formCliente");

  form.reset();
  document.getElementById("clienteId").value = "";
  document.getElementById("clienteSenha").value = "";

  if (clienteId) {
    titulo.textContent = "Editar Cliente";
    carregarDadosCliente(clienteId);
  } else {
    titulo.textContent = "Novo Cliente";
  }

  modal.style.display = "flex";
}

// Carregar dados do cliente
async function carregarDadosCliente(id) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .single();

  if (!error && data) {
    document.getElementById("clienteId").value = data.id;
    document.getElementById("clienteNome").value = data.nome || "";
    document.getElementById("clienteEmail").value = data.email;
    document.getElementById("clienteTelefone").value = data.telefone || "";
    document.getElementById("clienteViagem").value = data.viagem_id || "";
  }
}

// Salvar cliente
async function salvarCliente(e) {
  e.preventDefault();

  const id = document.getElementById("clienteId").value;
  const nome = document.getElementById("clienteNome").value.trim();
  const email = document.getElementById("clienteEmail").value.trim();
  const telefone = document.getElementById("clienteTelefone").value.trim();
  const viagem_id = document.getElementById("clienteViagem").value || null;
  const senha = document.getElementById("clienteSenha").value;

  if (id) {
    // ATUALIZAR cliente existente
    const { error } = await supabase
      .from("usuarios")
      .update({ nome, email, telefone, viagem_id })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar cliente: " + error.message);
      return;
    }

    alert("✅ Cliente atualizado com sucesso!");
  } else {
    // CRIAR novo cliente
    if (!senha || senha.length < 6) {
      alert("⚠️ Senha deve ter no mínimo 6 caracteres para novos clientes.");
      return;
    }

    // 1) Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (authError) {
      alert("Erro ao criar usuário no Auth: " + authError.message);
      return;
    }

    // 2) Criar registro na tabela usuarios
    const { error: dbError } = await supabase
      .from("usuarios")
      .insert({
        nome,
        email,
        telefone,
        tipo: "cliente",
        auth_id: authData.user.id,
        viagem_id,
      });

    if (dbError) {
      alert("Erro ao salvar cliente no banco: " + dbError.message);
      return;
    }

    alert("✅ Cliente criado com sucesso!");
  }

  fecharModal();
  carregarClientes();
}

// Excluir cliente
async function excluirCliente(id, nome) {
  if (!confirm(`⚠️ Deseja realmente excluir o cliente "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  const { error } = await supabase
    .from("usuarios")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erro ao excluir cliente: " + error.message);
    return;
  }

  alert("✅ Cliente excluído com sucesso!");
  carregarClientes();
}

// Fechar modal
function fecharModal() {
  document.getElementById("modalCliente").style.display = "none";
}

// Botão Sair
document.getElementById("btnSair")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
});

// Eventos
document.getElementById("btnNovoCliente").addEventListener("click", () => abrirModal());
document.getElementById("formCliente").addEventListener("submit", salvarCliente);
document.getElementById("btnCancelar").addEventListener("click", fecharModal);
document.querySelector(".close").addEventListener("click", fecharModal);

// Fechar modal clicando fora
window.addEventListener("click", (e) => {
  const modal = document.getElementById("modalCliente");
  if (e.target === modal) {
    fecharModal();
  }
});

// Expor funções globalmente
window.editarCliente = (id) => abrirModal(id);
window.excluirCliente = excluirCliente;

// Inicializar
verificarAuth();
carregarViagens();
carregarClientes();
