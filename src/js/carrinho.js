import { fmt } from './util.js';
import { pegarImagens } from './imagens.js';

export let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

export function salvarCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

export function adicionarCarrinho(produto) {
  const produtoPadrao = {
    descricao: produto.descricao || "",
    nce: produto.nce || "",
    grupo: produto.grupo || "",
    saldo: Number(produto.saldo || 0),
    cor: produto.cor || "",
    preco: Number(produto.preco) || 0
  };

  const produtoExistente = carrinho.find(p => p.nce === produtoPadrao.nce);

  if (produtoExistente) {
    produtoExistente.quantidade += 1;
  } else {
    carrinho.push({ ...produtoPadrao, quantidade: 1, garantia: 0 });
  }

  salvarCarrinho();
  render();
}

export function limparCarrinho() {
  carrinho.length = 0;
  salvarCarrinho();
  render();
}

// 🔹 Render do carrinho
export async function render() {
  const lista = document.getElementById('lista');
  const resultado = document.getElementById('resultado');
  if (!lista || !resultado) return;

  lista.innerHTML = '';
  const garantias = JSON.parse(localStorage.getItem('garantias') || '[]');

  for (let index = 0; index < carrinho.length; index++) {
    const p = carrinho[index];
    const div = document.createElement('div');
    div.classList.add('item');

    const g = garantias.find(k => k.nce === p.nce);
    const valorG1 = g ? (g.g1 || 0) * p.quantidade : 0;
    const valorG2 = g ? (g.g2 || 0) * p.quantidade : 0;

    const imagensProduto = await pegarImagens(p.nce);

    //fallback garantido
    const imagemPrincipal = imagensProduto[0] || 
      "https://raw.githubusercontent.com/ffsala2002-a11y/produtos-imagens/main/img-produtos/sem_img.png";

    div.innerHTML = `
      <div>
        <div class="aurora"></div>

        <div class="box-img">
          <img 
            class="img-produto" 
            src="${imagemPrincipal}" 
            data-nce="${p.nce}"
            onerror="this.src='https://raw.githubusercontent.com/ffsala2002-a11y/produtos-imagens/main/img-produtos/sem_img.png'"
          >
        </div>

        <div class="box-descricao">
          <p class="descricao">${p.descricao}</p>
        </div>

        <div class="info-produto">
          <small style="color:#ffffff;font-weight:bold;">🔢: ${p.nce}</small> |
          <small style="color:#ffffff;font-weight:bold;">🗄️: G${p.grupo || "-"}</small> |
          <small style="color:#F16800;font-weight:bold;">📦: ${p.saldo ?? "-"}</small> |
          <small style="font-weight:bold;font-size:10px;">🎨: ${p.cor || "-"}</small>
        </div>

        <div class="box-quantidade">
          <div class="quantidade">Quantidade: <span>${p.quantidade}</span></div>
          <div class="buttons">
            <button class="btn-minus">−</button>
            <button class="btn-plus">+</button>
          </div>
        </div>

        <div class="garantia-item">
          <label>Garantia:</label>
          <select class="select-garantia">
            <option value="0">Sem garantia</option>
            <option value="1">GE 1 (${fmt(valorG1)})</option>
            <option value="2">GE 2 (${fmt(valorG2)})</option>
          </select>
        </div>
      </div>

      <div>
        <strong class="valor-total">
          ${(Number(p.preco) * Number(p.quantidade)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
        </strong>
      </div>
    `;

    // 🔹 botões quantidade
    div.querySelector('.btn-plus').onclick = () => { 
      p.quantidade++; 
      salvarCarrinho(); 
      render(); 
    };

    div.querySelector('.btn-minus').onclick = () => { 
      if (p.quantidade > 1) p.quantidade--; 
      else carrinho.splice(index,1); 
      salvarCarrinho(); 
      render(); 
    };

    //garantia
    const select = div.querySelector('.select-garantia');
    select.value = p.garantia;
    select.onchange = e => { 
      p.garantia = Number(e.target.value); 
      salvarCarrinho(); 
      render(); 
    };

    // botão apagar
    const btnApagar = document.createElement('button');
    btnApagar.className = 'btn-apagar';
    btnApagar.innerHTML = `<img src="./src/img/trash-can.png">`;

    btnApagar.onclick = () => { 
      carrinho = carrinho.filter(item => item.nce !== p.nce); 
      salvarCarrinho(); 
      render(); 
      resultado.style = "display:none;";
    };

    div.appendChild(btnApagar);
    lista.appendChild(div);
  }
}

// CARROSSEL COMPLETO (robusto)
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("img-produto")) return;

  const nce = e.target.dataset.nce;
  let imagensOriginais = await pegarImagens(nce);

  if (!imagensOriginais.length) return;

  const modal = document.getElementById("modalCarrossel");
  const track = document.getElementById("carrosselTrack");
  const indicadoresBox = document.getElementById("indicadores");

  track.innerHTML = "";
  indicadoresBox.innerHTML = "";

  let imagens = [...imagensOriginais];

  // loop infinito só se tiver mais de 1 imagem
  if (imagensOriginais.length > 1) {
    imagens = [
      imagensOriginais[imagensOriginais.length - 1],
      ...imagensOriginais,
      imagensOriginais[0]
    ];
  }

  // cria imagens
  imagens.forEach(src => { 
    const img = document.createElement("img"); 
    img.src = src;

    img.onerror = () => {
      img.src = "https://raw.githubusercontent.com/ffsala2002-a11y/produtos-imagens/main/img-produtos/sem_img.png";
    };

    img.classList.add("img-carrossel"); 
    track.appendChild(img); 
  });

  // indicadores
  imagensOriginais.forEach((_, i) => { 
    const dot = document.createElement("div"); 
    dot.classList.add("indicador"); 
    if (i === 0) dot.classList.add("ativo"); 
    indicadoresBox.appendChild(dot); 
  });

  let index = imagensOriginais.length > 1 ? 1 : 0;
  let startX = 0;

  function atualizarIndicador(){
    const dots = document.querySelectorAll(".indicador");
    dots.forEach(d => d.classList.remove("ativo"));

    let realIndex;

    if (imagensOriginais.length === 1) {
      realIndex = 0;
    } else {
      realIndex = index - 1;

      if (index === 0) realIndex = imagensOriginais.length - 1;
      if (index === imagensOriginais.length + 1) realIndex = 0;
    }

    dots[realIndex]?.classList.add("ativo");
  }

  modal.style.display = "flex";
  track.style.transition = "none";
  track.style.transform = `translateX(-${index * 100}%)`;

  setTimeout(()=>{track.style.transition="transform 0.3s ease"},50);

  atualizarIndicador();

  track.ontouchstart = ev => { startX = ev.touches[0].clientX; };

  track.ontouchend = ev => {
    const endX = ev.changedTouches[0].clientX;
    const diff = startX - endX;

    if(diff > 50) index++;
    if(diff < -50) index--;

    track.style.transform = `translateX(-${index * 100}%)`;
    atualizarIndicador();

    if (imagensOriginais.length > 1) {
      setTimeout(()=>{
        if(index === 0) index = imagensOriginais.length;
        if(index === imagensOriginais.length + 1) index = 1;

        track.style.transition = "none";
        track.style.transform = `translateX(-${index * 100}%)`;

        atualizarIndicador();

        setTimeout(()=>{track.style.transition="transform 0.3s ease"},50);
      },300);
    }
  };
});

// fechar modal
document.getElementById("fecharModal").onclick = () => {
  document.getElementById("modalCarrossel").style.display="none";
};

document.addEventListener("DOMContentLoaded", () => {
  render();
});
