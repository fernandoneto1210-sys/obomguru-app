import { supabase } from './supabase.js';

// ========================================
// CARREGAR DESTINOS NO SELECT
// ========================================
async function carregarDestinos() {
  const select = document.getElementById('destino');
  if (!select) return;

  const { data, error } = await supabase
    .from('destinos')
    .select('id, nome, pais')
    .order('nome');

  if (error) {
    console.error('Erro ao carregar destinos:', error);
    alert('Erro ao carregar destinos.');
    return;
  }

  select.innerHTML = '';
  data.forEach(destino => {
    const opt = document.createElement('option');
    opt.value = destino.id;
    opt.textContent = `${destino.nome} - ${destino.pais}`;
    select.appendChild(opt);
  });
}

// ========================================
// CARREGAR VIAGENS NOS SELECTS
// ========================================
async function carregarViagensNosSelects() {
  const selects = [
    document.getElementById('roteiro-viagem'),
    document.getElementById('documentos-viagem'),
    document.getElementById('contatos-viagem'),
    document.getElementById('alertas-viagem')
  ].filter(Boolean);

  if (selects.length === 0) return;

  const { data, error } = await supabase
    .from('viagens')
    .select('id, nome_viagem, data_saida, data_retorno')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar viagens:', error);
    alert('Erro ao carregar lista de viagens.');
    return;
  }

  selects.forEach(sel => {
    sel.innerHTML = '';
    data.forEach(viagem => {
      const opt = document.createElement('option');
      const saida = viagem.data_saida
        ? new Date(viagem.data_saida).toLocaleDateString('pt-BR')
        : '';
      const retorno = viagem.data_retorno
        ? new Date(viagem.data_retorno).toLocaleDateString('pt-BR')
        : '';
      opt.value = viagem.id;
      opt.textContent = `${viagem.nome_viagem} (${saida} → ${retorno})`;
      sel.appendChild(opt);
    });
  });
}

// ========================================
// SALVAR DESTINO
// ========================================
async function salvarDestino(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    nome: form.nome.value.trim(),
    pais: form.pais.value.trim(),
    moeda: form.moeda.value.trim(),
    simbolo_moeda: form.simbolo_moeda.value.trim(),
    dicas_gerais: form.dicas_gerais.value.trim(),
    imagem_capa_url: form.imagem_capa_url.value.trim() || null
  };

  const { error } = await supabase.from('destinos').insert(payload);

  if (error) {
    console.error('Erro ao salvar destino:', error);
    alert('Erro ao salvar destino.');
    return;
  }

  alert('Destino salvo com sucesso!');
  form.reset();
  await carregarDestinos();
}

// ========================================
// SALVAR VIAGEM
// ========================================
async function salvarViagem(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    destino_id: form.destino.value,
    nome_viagem: form.nome_viagem.value.trim(),
    data_saida: form.data_saida.value || null,
    data_retorno: form.data_retorno.value || null
  };

  const { data, error } = await supabase
    .from('viagens')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao salvar viagem:', error);
    alert('Erro ao salvar viagem.');
    return;
  }

  const url = `${window.location.origin}/viagem.html?id=${data.id}`;
  alert(`Viagem criada com sucesso!\n\nLink para enviar ao cliente:\n${url}`);
  form.reset();
  await carregarViagensNosSelects();
}

// ========================================
// SALVAR DIA DO ROTEIRO
// ========================================
async function salvarRoteiro(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    viagem_id: form.viagem_id.value,
    dia: Number(form.dia.value),
    titulo: form.titulo.value.trim(),
    descricao: form.descricao.value.trim()
  };

  const { error } = await supabase.from('roteiro_dias').insert(payload);

  if (error) {
    console.error('Erro ao salvar dia do roteiro:', error);
    alert('Erro ao salvar dia do roteiro.');
    return;
  }

  alert('Dia do roteiro salvo com sucesso!');
  form.reset();
}

// ========================================
// SALVAR DOCUMENTO
// ========================================
async function salvarDocumento(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    viagem_id: form.viagem_id.value,
    tipo: form.tipo.value,
    nome: form.nome.value.trim(),
    link: form.link.value.trim() || null,
    observacoes: form.observacoes.value.trim() || null
  };

  const { error } = await supabase.from('documentos').insert(payload);

  if (error) {
    console.error('Erro ao salvar documento:', error);
    alert('Erro ao salvar documento.');
    return;
  }

  alert('Documento salvo com sucesso!');
  form.reset();
}

// ========================================
// SALVAR CONTATO
// ========================================
async function salvarContato(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    viagem_id: form.viagem_id.value,
    tipo: form.tipo.value,
    nome: form.nome.value.trim(),
    telefone: form.telefone.value.trim() || null,
    email: form.email.value.trim() || null,
    observacoes: form.observacoes.value.trim() || null
  };

  const { error } = await supabase.from('contatos').insert(payload);

  if (error) {
    console.error('Erro ao salvar contato:', error);
    alert('Erro ao salvar contato.');
    return;
  }

  alert('Contato salvo com sucesso!');
  form.reset();
}

// ========================================
// SALVAR ALERTA
// ========================================
async function salvarAlerta(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    viagem_id: form.viagem_id.value,
    tipo: form.tipo.value,
    titulo: form.titulo.value.trim(),
    mensagem: form.mensagem.value.trim(),
    prioridade: form.prioridade.value
  };

  const { error } = await supabase.from('alertas').insert(payload);

  if (error) {
    console.error('Erro ao salvar alerta:', error);
    alert('Erro ao salvar alerta.');
    return;
  }

  alert('Alerta salvo com sucesso!');
  form.reset();
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  await carregarDestinos();
  await carregarViagensNosSelects();

  const formDestino = document.getElementById('form-destino');
  if (formDestino) formDestino.addEventListener('submit', salvarDestino);

  const formViagem = document.getElementById('form-viagem');
  if (formViagem) formViagem.addEventListener('submit', salvarViagem);

  const formRoteiro = document.getElementById('form-roteiro');
  if (formRoteiro) formRoteiro.addEventListener('submit', salvarRoteiro);

  const formDocumentos = document.getElementById('form-documentos');
  if (formDocumentos) formDocumentos.addEventListener('submit', salvarDocumento);

  const formContatos = document.getElementById('form-contatos');
  if (formContatos) formContatos.addEventListener('submit', salvarContato);

  const formAlertas = document.getElementById('form-alertas');
  if (formAlertas) formAlertas.addEventListener('submit', salvarAlerta);
});
