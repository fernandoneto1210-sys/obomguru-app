import { supabase } from "./supabase.js";

async function carregarViagem() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.body.innerHTML = '<p style="text-align:center;padding:2rem;">Viagem não encontrada.</p>';
    return;
  }

  try {
    const { data: viagem, error } = await supabase
      .from('viagens')
      .select(`
        *,
        destinos (*),
        dias_roteiro (*),
        documentos (*),
        contatos (*),
        alertas (*)
      `)
      .eq('id', id)
      .single();

    if (error || !viagem) {
      document.body.innerHTML = '<p style="text-align:center;padding:2rem;">Viagem não encontrada.</p>';
      return;
    }

    // Título
    document.getElementById('tituloViagem').textContent = viagem.nome_viagem;

    // Informações básicas
    const infoBasica = document.getElementById('infoBasica');
    infoBasica.innerHTML = `
      <h3>${viagem.destinos.nome} - ${viagem.destinos.pais}</h3>
      <p><strong>Saída:</strong> ${new Date(viagem.data_saida).toLocaleDateString('pt-BR')}</p>
      <p><strong>Retorno:</strong> ${new Date(viagem.data_retorno).toLocaleDateString('pt-BR')}</p>
      <p><strong>Moeda:</strong> ${viagem.destinos.simbolo_moeda} ${viagem.destinos.moeda}</p>
      ${viagem.destinos.dicas ? `<p><strong>Dicas:</strong> ${viagem.destinos.dicas}</p>` : ''}
    `;

    // Roteiro
    const roteiroDiv = document.getElementById('roteiro');
    if (viagem.dias_roteiro && viagem.dias_roteiro.length > 0) {
      viagem.dias_roteiro.sort((a, b) => a.dia - b.dia).forEach(dia => {
        const bloco = document.createElement('div');
        bloco.className = 'dia';
        bloco.innerHTML = `
          <h3>Dia ${dia.dia}${dia.titulo ? ': ' + dia.titulo : ''}</h3>
          ${dia.descricao ? `<p>${dia.descricao}</p>` : ''}
          ${dia.atividades ? `<ul>${dia.atividades.map(a => `<li>${a.horario || ''} – ${a.descricao || ''}</li>`).join('')}</ul>` : ''}
          ${dia.imagens ? dia.imagens.map(i => `<img src="${i.url}" alt="${i.legenda || ''}" class="resp-img">`).join('') : ''}
        `;
        roteiroDiv.appendChild(bloco);
      });
    } else {
      roteiroDiv.innerHTML = '<p>Roteiro ainda não cadastrado.</p>';
    }

    // Documentos
    const docsDiv = document.getElementById('documentos');
    if (viagem.documentos && viagem.documentos.length > 0) {
      viagem.documentos.forEach(doc => {
        const a = document.createElement('a');
        a.href = doc.url;
        a.textContent = doc.nome;
        a.target = '_blank';
        a.style.display = 'block';
        a.style.marginBottom = '0.5rem';
        docsDiv.appendChild(a);
      });
    } else {
      docsDiv.innerHTML = '<p>Nenhum documento anexado.</p>';
    }

    // Contatos
    const contatosDiv = document.getElementById('contatos');
    if (viagem.contatos && viagem.contatos.length > 0) {
      viagem.contatos.forEach(c => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${c.tipo}:</strong> ${c.nome} - ${c.telefone || ''} ${c.email || ''}`;
        contatosDiv.appendChild(p);
      });
    } else {
      contatosDiv.innerHTML = '<p>Nenhum contato cadastrado.</p>';
    }

    // Alertas
    const alertasDiv = document.getElementById('alertas');
    if (viagem.alertas && viagem.alertas.length > 0) {
      viagem.alertas.forEach(a => {
        const p = document.createElement('p');
        p.textContent = `${new Date(a.data_hora).toLocaleString('pt-BR')}: ${a.mensagem}`;
        alertasDiv.appendChild(p);
      });
    } else {
      alertasDiv.innerHTML = '<p>Nenhum alerta cadastrado.</p>';
    }

    // Botão PDF (simples - usando window.print por enquanto)
    document.getElementById('btnPdf').addEventListener('click', () => {
      window.print();
    });

  } catch (erro) {
    console.error('Erro ao carregar viagem:', erro);
    document.body.innerHTML = '<p style="text-align:center;padding:2rem;">Erro ao carregar viagem.</p>';
  }
}

carregarViagem();


