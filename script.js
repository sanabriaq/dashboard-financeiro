
let salario = parseFloat(localStorage.getItem('salario')) || 0;
let despesas = JSON.parse(localStorage.getItem('despesas')) || [];
let filtroAtivo = 'Todos';
let ordemAtiva = 'recentes';
let buscaAtiva = '';

// Cores e ícones de cada categoria (mesma paleta do CSS)
const CATEGORIAS = {
  'Alimentação': { cor: '#c8ff3d', icone: '🍔' },
  'Transporte': { cor: '#4dd0ff', icone: '🚌' },
  'Lazer': { cor: '#7b61ff', icone: '🎮' },
  'Saúde': { cor: '#ff8fd8', icone: '💊' },
  'Moradia': { cor: '#ffd23f', icone: '🏠' },
  'Outros': { cor: '#bdb6a8', icone: '📦' },
};

// ELEMENTOS DO DOM
const elSalario = document.getElementById('salario');
const elTotalGasto = document.getElementById('total-gasto');
const elSaldoRestante = document.getElementById('saldo-restante');
const elCardSaldo = document.getElementById('card-saldo');
const elSaldoStatus = document.getElementById('saldo-status');
const elMedidor = document.getElementById('medidor');
const elPercentual = document.getElementById('percentual');
const elQtd = document.getElementById('qtd-lancamentos');
const elContador = document.getElementById('contador');
const elLegenda = document.getElementById('legenda');
const elGraficoTotal = document.getElementById('grafico-total');
const elAviso = document.getElementById('aviso');
const inputSalario = document.getElementById('input-salario');
const btnSalario = document.getElementById('btn-salario');
const inputDescricao = document.getElementById('descricao');
const inputValor = document.getElementById('valor');
const selectCategoria = document.getElementById('categoria');
const btnAdicionar = document.getElementById('btn-adicionar');
const listaDespesas = document.getElementById('lista-despesas');

// FUNÇÕES
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function calcularTotal() {
  return despesas.reduce((acc, d) => acc + d.valor, 0);
}

function mostrarAviso(mensagem, tipo = 'erro') {
  elAviso.textContent = mensagem;
  elAviso.className = `aviso ${tipo}`;
  clearTimeout(mostrarAviso.timer);
  mostrarAviso.timer = setTimeout(() => { elAviso.textContent = ''; }, 2500);
}

function atualizarCards() {
  const total = calcularTotal();
  const saldo = salario - total;
  const percentual = salario > 0 ? (total / salario) * 100 : 0;

  elSalario.textContent = formatarMoeda(salario);
  elTotalGasto.textContent = formatarMoeda(total);
  elSaldoRestante.textContent = formatarMoeda(saldo);
  elQtd.textContent = despesas.length;
  elContador.textContent = despesas.length;

  elMedidor.style.width = `${Math.min(percentual, 100)}%`;
  elPercentual.textContent = `${Math.round(percentual)}%`;

  // Muda o visual do card de saldo conforme o valor
  let estado = 'ok';
  let status = 'Tudo certo';
  if (saldo < 0) {
    estado = 'negativo';
    status = 'No vermelho';
  } else if (salario > 0 && saldo < salario * 0.2) {
    estado = 'atencao';
    status = 'Atenção';
  } else if (salario === 0) {
    status = 'Defina o salário';
  }
  elCardSaldo.dataset.estado = estado;
  elSaldoStatus.textContent = status;
}

function renderizarLista() {
  listaDespesas.innerHTML = '';
 let visiveis = filtroAtivo === 'Todos'
    ? despesas
    : despesas.filter(d => d.categoria === filtroAtivo);

if (buscaAtiva) {
    visiveis = visiveis.filter(d =>
        d.descricao.toLowerCase().includes(buscaAtiva.toLowerCase())
    );
}
    const ordenados = ordemAtiva === 'recentes'
  ? [...visiveis].reverse()
  : [...visiveis].sort((a, b) => b.valor - a.valor);

  if (visiveis.length === 0) {
    listaDespesas.innerHTML =
      '<li class="vazio"><strong>¯\\_(ツ)_/¯</strong>Nenhuma despesa ainda. Bora lançar a primeira?</li>';
    return;
  }

  // Mais recentes primeiro
ordenados.map((despesa, index) => ({ despesa, index })).forEach(({ despesa, index }) => {
    const info = CATEGORIAS[despesa.categoria] || CATEGORIAS.Outros;
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item-info">
        <span class="item-icone" style="background:${info.cor}">${info.icone}</span>
        <div class="item-textos">
          <span class="item-descricao">${escaparHTML(despesa.descricao)}</span>
         <span class="item-categoria">${escaparHTML(despesa.categoria)}</span>
         <span class="item-data">${formatarData(despesa.data)}</span>
        </div>
      </div>
      <div class="item-direita">
        <span class="item-valor">− ${formatarMoeda(despesa.valor)}</span>
        <button aria-label="Remover despesa" onclick="deletarDespesa(${despesas.indexOf(despesa)}, this)">✕</button>
      </div>
    `;
    listaDespesas.appendChild(li);
  });
}

function salvarLocalStorage() {
  localStorage.setItem('salario', salario);
  localStorage.setItem('despesas', JSON.stringify(despesas));
}

function atualizarTudo() {
  salvarLocalStorage();
  atualizarCards();
  renderizarLista();
  atualizarGrafico();
}

function deletarDespesa(index, botao) {
  const confirmado = window.confirm('Remover essa despesa?');
  if (!confirmado) return;

  const li = botao.closest('li');
  li.classList.add('saindo');
  setTimeout(() => {
    despesas.splice(index, 1);
    atualizarTudo();
  }, 240);
}

// EVENTOS
btnSalario.addEventListener('click', () => {
  const valor = parseFloat(inputSalario.value);
  if (!valor || valor <= 0) {
    inputSalario.focus();
    return mostrarAviso('Digite um salário válido.');
  }
  salario = valor;
  inputSalario.value = '';
  atualizarTudo();
  mostrarAviso('Salário atualizado ✓', 'sucesso');
});

inputSalario.addEventListener('keydown', e => {
  if (e.key === 'Enter') btnSalario.click();
});

btnAdicionar.addEventListener('click', () => {
  const descricao = inputDescricao.value.trim();
  const valor = parseFloat(inputValor.value);
  const categoria = selectCategoria.value;

  if (!descricao) {
    inputDescricao.focus();
    return mostrarAviso('Digite uma descrição.');
  }
  if (!valor || valor <= 0) {
    inputValor.focus();
    return mostrarAviso('Digite um valor válido.');
  }

  despesas.push({ descricao, valor, categoria, data: new Date().toISOString() }); atualizarTudo();

  inputDescricao.value = '';
  inputValor.value = '';
  inputDescricao.focus();
  mostrarAviso('Despesa adicionada ✓', 'sucesso');
});

[inputDescricao, inputValor].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnAdicionar.click();
  });
});

// GRÁFICO (Chart.js)
let grafico = null;

function atualizarGrafico() {
  const nomes = Object.keys(CATEGORIAS);
  const cores = nomes.map(n => CATEGORIAS[n].cor);
  const totais = nomes.map(cat =>
    despesas.filter(d => d.categoria === cat).reduce((acc, d) => acc + d.valor, 0)
  );
  const total = totais.reduce((a, b) => a + b, 0);

  elGraficoTotal.textContent = formatarMoeda(total);

  // Legenda personalizada
  elLegenda.innerHTML = nomes.map((nome, i) => {
    const pct = total > 0 ? Math.round((totais[i] / total) * 100) : 0;
    return `
      <li class="${totais[i] === 0 ? 'zerado' : ''}">
        <span class="bolinha" style="background:${cores[i]}"></span>
        <span>${nome}</span>
        <span class="pct">${pct}%</span>
      </li>`;
  }).join('');

  if (typeof Chart === 'undefined') return;

  // Sem gastos: mostra um anel vazio
  const dados = total > 0 ? totais : [1];
  const coresFinais = total > 0 ? cores : ['#e8e0d0'];

  if (grafico) {
    grafico.data.datasets[0].data = dados;
    grafico.data.datasets[0].backgroundColor = coresFinais;
    grafico.options.plugins.tooltip.enabled = total > 0;
    grafico.update();
    return;
  }

  grafico = new Chart(document.getElementById('grafico-pizza'), {
    type: 'doughnut',
    data: {
      labels: nomes,
      datasets: [{
        data: dados,
        backgroundColor: coresFinais,
        borderColor: '#111111',
        borderWidth: 3,
        hoverOffset: 10,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      layout: { padding: 8 },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: total > 0,
          backgroundColor: '#111111',
          titleFont: { family: 'Space Grotesk', weight: '700' },
          bodyFont: { family: 'JetBrains Mono' },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: ctx => ` ${formatarMoeda(ctx.parsed)}`
          }
        }
      }
    }
  });
}

document.getElementById('filtros').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  filtroAtivo = chip.dataset.filtro;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('ativo'));
  chip.classList.add('ativo');
  renderizarLista();
});


document.getElementById('btn-ordem').addEventListener('click', () => {
  ordemAtiva = ordemAtiva === 'recentes' ? 'maior' : 'recentes';
  const btn = document.getElementById('btn-ordem');
  btn.textContent = ordemAtiva === 'recentes' ? '↓ Recentes' : '↓ Maior valor';
  renderizarLista();
});

document.getElementById('btn-exportar').addEventListener('click', () => {
  if (despesas.length === 0) return mostrarAviso('Nenhuma despesa para exportar.');
  
  const linhas = [
    ['Descrição', 'Categoria', 'Valor (R$)', 'Data'],
    ...despesas.map(d => [
      d.descricao,
      d.categoria,
      d.valor.toFixed(2).replace('.', ','),
      d.data ? new Date(d.data).toLocaleDateString('pt-BR') : ''
    ])
  ];

  const csv = linhas.map(l => l.join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'despesas.csv';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('busca').addEventListener('input', e => {
  buscaAtiva = e.target.value.trim();
  renderizarLista();
});

// INICIALIZAR
const hoje = new Date();
document.getElementById('data-atual').textContent =
  hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

atualizarCards();
renderizarLista();
atualizarGrafico();
