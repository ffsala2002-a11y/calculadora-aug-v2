import { iniciarBancoImagens, pegarImagens } from './src/js/imagens.js';
import { carregarBase, limparBase } from './src/js/base.js';
import { adicionarCarrinho, limparCarrinho, carrinho } from './src/js/carrinho.js';
import { calcularTotal } from './src/js/calculo.js';
import uploadLateral from './src/js/uploadLateral.js';
import { lupaMovie } from './src/js/lupaMovie.js';
import { popupMobile } from './src/js/popup.js';

// 🔥 inicia banco de imagens
iniciarBancoImagens();

const fileProdutos = document.getElementById('fileProdutos');
const fileGarantias = document.getElementById('fileGarantias');
const msg = document.getElementById('msg');
const busca = document.getElementById('busca');
const sugestoes = document.getElementById('sugestoes');
const sugestoesBody = document.getElementById('sugestoesBody');
const parcelas = document.getElementById('parcelas');
const taxa = document.getElementById('taxa');
const entrada = document.getElementById('entrada');
const arredondar = document.getElementById('arredondar');
const resultado = document.getElementById('resultado');

// 🔥 controle anti duplicação
let buscaAtual = 0;

// ================= ALERTA =================
function mostrarAlerta(msg, tipo = "erro", tempo = 3000) {
  let alerta = document.getElementById("alerta");

  if (!alerta) {
    alerta = document.createElement("div");
    alerta.id = "alerta";
    alerta.className = "alerta";
    document.body.appendChild(alerta);
  }

  alerta.innerText = msg;

  if (tipo === "erro") alerta.style.background = "#f44336";
  else if (tipo === "sucesso") alerta.style.background = "#4CAF50";
  else alerta.style.background = "#0068bd";

  void alerta.offsetWidth;
  alerta.classList.add("show");

  setTimeout(() => alerta.classList.remove("show"), tempo);
}

// ================= BASE =================
document.getElementById('btnSalvar').addEventListener('click', () => {
  if (!fileProdutos.files[0] || !fileGarantias.files[0]) {
    mostrarAlerta('Você precisa selecionar os dois arquivos.', 'erro');
    return;
  }

  carregarBase(fileProdutos.files[0], fileGarantias.files[0], len => {
    mostrarAlerta(`✔ Base carregada (${len} produtos)`, 'sucesso');
    atualizarResumoBase();
  });
});

document.getElementById('btnLimparBase').addEventListener('click', () => {
  limparBase();
  msg.innerText = '';
  limparCarrinho();
  resultado.style = "display:none;";
  mostrarAlerta('Base e carrinho limpos.', 'info');

  document.getElementById("totalProdutos").innerText = 0;
  document.getElementById("totalSaldo").innerText = 0;
  document.getElementById("totalGarantias").innerText = 0;
});

// ================= CARRINHO =================
document.getElementById('btnLimparItens').addEventListener('click', () => {
  limparCarrinho();
  resultado.style = "display:none;";
  mostrarAlerta('Carrinho limpo.', 'info');
});

// ================= CALCULAR =================
document.getElementById('btnCalcular').addEventListener('click', () => {
  if (!carrinho.length) {
    mostrarAlerta('Adicione produtos ao carrinho antes de calcular.', 'erro');
    return;
  }

  const r = calcularTotal(
    entrada.value,
    parcelas.value,
    taxa.value,
    arredondar.checked
  );

  resultado.style.display = 'flex';
  resultado.innerHTML = `
    <p><strong>Total:</strong> ${r.total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
    <p><strong>Entrada:</strong> ${r.entrada.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
    <p><strong>Financiado:</strong> ${r.financiado.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
    <p><strong>Parcelas:</strong> ${r.parcelas}x de ${r.valorParcela.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
    <p><strong>Total c/ juros:</strong> ${r.totalComJuros.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
    <p><strong>Juros:</strong> ${r.jurosAplicado.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
  `;
});

// ================= BUSCA (FINAL CORRIGIDA) =================
busca.addEventListener('input', () => {
  const idBusca = ++buscaAtual;

  const q = busca.value.toLowerCase().trim();
  sugestoesBody.innerHTML = '';

  if (!q) {
    sugestoes.style.display = 'none';
    return;
  }

  const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');

  const filtrados = produtos
    .filter(p =>
      String(p.nce).includes(q) ||
      p.descricao.toLowerCase().includes(q)
    )
    .slice(0, 25);

  filtrados.forEach(p => {

    if (idBusca !== buscaAtual) return;

    const tr = document.createElement('tr');

    const placeholder = "https://raw.githubusercontent.com/ffsala2002-a11y/produtos-imagens/main/img-produtos/sem_img.png";

    tr.innerHTML = `
      <td class="imgProduto">
        <img src="${placeholder}" loading="lazy">
      </td>
      <td>${p.nce}</td>
      <td>${p.descricao}</td>
      <td class="preco">
        <span>${p.preco.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
      </td>
    `;

    // 🔥 carrega imagem sem travar
    pegarImagens(p.nce).then(imgs => {
      if (idBusca !== buscaAtual) return;

      const imgEl = tr.querySelector("img");
      if (imgEl) {
        imgEl.src = imgs[0];
        imgEl.onerror = () => imgEl.src = placeholder;
      }
    });

    tr.onclick = () => {
      adicionarCarrinho(p);
      busca.value = '';
      sugestoes.style.display = 'none';
      mostrarAlerta('Produto adicionado ao carrinho.', 'sucesso');
    };

    sugestoesBody.appendChild(tr);
  });

  sugestoes.style.display = 'block';
});

document.getElementById("deleteInput").addEventListener('click', () => {
  busca.value = "";
  sugestoes.style.display = 'none';
});

// ================= PARCELAS =================
for (let i = 1; i <= 12; i++) {
  parcelas.innerHTML += `<option value="${i}">${i}x</option>`;
}

// ================= ENTRADA =================
entrada.addEventListener('input', () => {
  let v = entrada.value.replace(/\D/g, '');
  entrada.value = (Number(v) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
});

// ================= RESUMO =================
function atualizarResumoBase() {
  const produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
  const garantias = JSON.parse(localStorage.getItem("garantias") || "[]");

  document.getElementById("totalProdutos").innerText = produtos.length;
  document.getElementById("totalSaldo").innerText =
    produtos.reduce((acc,p)=>acc+(Number(p.saldo)||0),0);
  document.getElementById("totalGarantias").innerText = garantias.length;
}

// ================= INIT =================
uploadLateral();
lupaMovie();
atualizarResumoBase();
popupMobile();