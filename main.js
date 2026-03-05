import { iniciarBancoImagens, pegarImagens } from './src/js/imagens.js';

import { carregarBase, limparBase } from './src/js/base.js';

import { adicionarCarrinho, limparCarrinho, carrinho } from './src/js/carrinho.js';

import { calcularTotal } from './src/js/calculo.js';

import uploadLateral from './src/js/uploadLateral.js';

import { lupaMovie } from './src/js/lupaMovie.js';



// 🔥 INICIA O BANCO DE IMAGENS PRIMEIRO

iniciarBancoImagens();



const fileProdutos = document.getElementById('fileProdutos');

const fileGarantias = document.getElementById('fileGarantias');

const msg = document.getElementById('msg');

const busca = document.getElementById('busca');

const sugestoes = document.getElementById('sugestoes');

const parcelas = document.getElementById('parcelas');

const taxa = document.getElementById('taxa');

const entrada = document.getElementById('entrada');

const arredondar = document.getElementById('arredondar');

const resultado = document.getElementById('resultado');



// ================= ALERTA ESTILIZADO =================



function mostrarAlerta(msg, tipo = "erro", tempo = 3000) {

  let alerta = document.getElementById("alerta");

  

  if (!alerta) {

    alerta = document.createElement("div");

    alerta.id = "alerta";

    alerta.className = "alerta";

    document.body.appendChild(alerta);

  }

  

  alerta.innerText = msg;

  

  if (tipo === "erro") {

    alerta.style.background = "#f44336";

  } else if (tipo === "sucesso") {

    alerta.style.background = "#4CAF50";

  } else {

    alerta.style.background = "#0068bd";

  }

  

  //  força reflow para garantir animação

  void alerta.offsetWidth;

  

  //  aparece deslizando

  alerta.classList.add("show");

  

  //  some depois do tempo

  setTimeout(() => {

    alerta.classList.remove("show");

  }, tempo);

}



// ================= BASE =================



document.getElementById('btnSalvar').addEventListener('click', () => {

  if (!fileProdutos.files[0] || !fileGarantias.files[0]) {

    mostrarAlerta('Você precisa selecionar os dois arquivos.', 'erro');

    return;

  }

  

  ////////

  //NOVO

  ////////

  carregarBase(fileProdutos.files[0], fileGarantias.files[0], len => {

    mostrarAlerta(`✔ Base carregada (${len} produtos)`, 'sucesso');

    atualizarResumoBase(); // 🔥 adiciona isso

  });

});



document.getElementById('btnLimparBase').addEventListener('click', () => {

  limparBase();

  msg.innerText = '';

  limparCarrinho();

  resultado.style = "display:none;";

  mostrarAlerta('Base e carrinho limpos.', 'info');

  

  ///////////

  //NOVO

  //////////

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

  

  const resultadoCalculo = calcularTotal(

    entrada.value,

    parcelas.value,

    taxa.value,

    arredondar.checked

  );

  

  const {

    total,

    financiado,

    entrada: entVal,

    valorParcela,

    parcelas: qtdParcelas,

    totalComJuros,

    jurosAplicado

  } = resultadoCalculo;

  

  resultado.style.display = 'flex';

  resultado.innerHTML = `

    <p><strong>Total:</strong> <span>${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<span></p>

    <p><strong>Entrada:</strong> <span>${entVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>

    <p><strong>Valor financiado:</strong> <span>${financiado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>

    <p><strong>Parcelas:</strong> <span>${qtdParcelas}x de ${valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>

    <p><strong>Total com juros:</strong> <span>${totalComJuros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>

    <p><strong>Juros aplicado:</strong> <span>${jurosAplicado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>

  `;

});



// ================= BUSCA =================



const sugestoesBody = document.getElementById('sugestoesBody');



busca.addEventListener('input', () => {

  const q = busca.value.toLowerCase().trim();

  sugestoesBody.innerHTML = '';

  

  if (!q) {

    sugestoes.style.display = 'none';

    return;

  }

  

  const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');

  

  produtos

    .filter(p =>

      p.nce.includes(q) ||

      p.descricao.toLowerCase().includes(q)

    )

    .slice(0, 25)

    .forEach(async p => {

      

      const tr = document.createElement('tr');

      

      const imgs = await pegarImagens(p.nce);

      const img = imgs[0];

      

      tr.innerHTML = `

    <td class="imgProduto">

      <img src="${img}" loading="lazy">

    </td>

    <td>${p.nce}</td>

    <td>${p.descricao}</td>

    <td class="preco">

      <span>${p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>

    </td>

  `;

      

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



/////////

//NOVO

////////

function atualizarResumoBase() {

  const produtos = JSON.parse(localStorage.getItem("produtos") || "[]");

  const garantias = JSON.parse(localStorage.getItem("garantias") || "[]");

  

  const totalProdutos = produtos.length;

  

  const somaSaldo = produtos.reduce((acc, p) => {

    return acc + (Number(p.saldo) || 0);

  }, 0);

  

  const totalGarantias = garantias.length;

  

  document.getElementById("totalProdutos").innerText = totalProdutos;

  document.getElementById("totalSaldo").innerText = somaSaldo;

  document.getElementById("totalGarantias").innerText = totalGarantias;

}



// ================= LATERAIS =================



uploadLateral();

lupaMovie();



/////////////////////////

//ATUALIZAR BASE RESUMO

////////////////////////



atualizarResumoBase();
