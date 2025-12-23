import { supabase } from "./supabase.js";
import { mostrarMensagem } from "./utils.js";

// Carregar destinos no select
async function carregarDestinos() {
  const select = document.getElementById('selectDestino');

  const { data, error } = await supabase
    .from('destinos')
    .select('id, nome')
    .order('nome');

  if (error) {
    console.error('Erro ao carregar destinos:', error);
    return;
  }

  data.forEach(destino => {
    const option = document.createElement('option');
    option.value = destino.id;
    option.textContent = destino.nome;
    select.appendChild(option);
  });
}

// Cadastrar novo destino
const formDestino = document.getElementById('formDestino');
formDestino?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = e.target.nome.value.trim();
  const pais = e.target.pais.value.trim();
  const moeda = e.target.moeda.value.trim();
  const simbolo = e.target.simbolo.value.trim();
  const dicas = e.target.dicas.value.trim();
  const imagem = e.target.imagem.value.trim();

  try {
    const { data, error } = await supabase
      .from('destinos')
      .insert([{
        nome,
        pais,
        moeda,
        simbolo_moeda: simbolo,
        dicas,
        imagem_capa: imagem
      }])
      .select();

    if (error) {
      alert('Erro ao salvar destino: ' + error.message);
      return;
    }

    alert('Destino salvo com sucesso!');
    e.target.reset();
    carregarDestinos(); // Atualizar select

  } catch (erro) {
    console.error('Erro:', erro);
    alert('Erro ao salvar destino.');
  }
});

// Cadastrar nova viagem
const formViagem = document.getElementById('formViagem');
formViagem?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const destinoId = e.target.destino.value;
  const nomeViagem = e.target.nomeViagem.value.trim();
  const dataSaida = e.target.dataSaida.value;
  const dataRetorno = e.target.dataRetorno.value;

  if (!destinoId) {
    alert('Selecione um destino.');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('viagens')
      .insert([{
        destino_id: destinoId,
        nome_viagem: nomeViagem,
        data_saida: dataSaida,
        data_retorno: dataRetorno
      }])
      .select();

    if (error) {
      alert('Erro ao criar viagem: ' + error.message);
      return;
    }

    const viagemId = data[0].id;
    const link = `${window.location.origin}/viagem.html?id=${viagemId}`;

    document.getElementById('linkViagem').innerHTML = `
      <strong>Viagem criada com sucesso!</strong><br>
      Link para enviar ao cliente:<br>
      <a href="${link}" target="_blank">${link}</a>
    `;

    e.target.reset();

  } catch (erro) {
    console.error('Erro:', erro);
    alert('Erro ao criar viagem.');
  }
});

// Carregar destinos ao abrir a página
carregarDestinos();


