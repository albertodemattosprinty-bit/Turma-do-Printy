import { musicas } from './Músicas.js';
import { textos } from './Textos.js';
import { videos } from './Vídeos.js';

const secoes = [...document.querySelectorAll('.secao')];
const listaMusicas = document.getElementById('lista-musicas');
const listaTextos = document.getElementById('lista-textos');
const listaVideos = document.getElementById('lista-videos');
const pesquisa = document.getElementById('pesquisa');
const playerFixo = document.getElementById('player-fixo');
const musicaAtual = document.getElementById('musica-atual');
const barraProgresso = document.getElementById('barra-progresso');
const btnPausar = document.getElementById('btn-pausar');
const btnProxima = document.getElementById('btn-proxima');

const audio = new Audio();
let indiceAtual = -1;
let musicaFiltrada = [...musicas];

const normalizar = (valor) =>
  valor
    .normalize('NFD')
    .replace(/[^\w\s]|_/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

const mostrarSecao = (id) => {
  secoes.forEach((secao) => secao.classList.toggle('ativa', secao.id === id));
  pesquisa.parentElement.classList.toggle('oculto', id !== 'musicas' && id !== 'home');
  if (id !== 'musicas') playerFixo.classList.add('oculto');
  if (id === 'musicas' && indiceAtual >= 0) playerFixo.classList.remove('oculto');
};

const tocarIndice = (indiceListaFiltrada) => {
  const musica = musicaFiltrada[indiceListaFiltrada];
  if (!musica) return;

  const indiceOriginal = musicas.findIndex((item) => item.arquivo === musica.arquivo);
  const mesmaMusica = indiceAtual === indiceOriginal;

  if (mesmaMusica && !audio.paused) {
    audio.pause();
    atualizarBotoes();
    return;
  }

  indiceAtual = indiceOriginal;
  audio.src = `Músicas/${musica.arquivo}`;
  audio.play();
  musicaAtual.textContent = musica.nome;
  playerFixo.classList.remove('oculto');
  atualizarBotoes();
  marcarAtivo();
};

const atualizarBotoes = () => {
  btnPausar.textContent = audio.paused ? 'Tocar' : 'Pausar';
};

const marcarAtivo = () => {
  document.querySelectorAll('#lista-musicas .item').forEach((el) => {
    const ativo = Number(el.dataset.indice) === indiceAtual;
    el.classList.toggle('ativo', ativo);
  });
};

const renderMusicas = () => {
  listaMusicas.innerHTML = '';

  musicaFiltrada.forEach((musica) => {
    const indiceOriginal = musicas.findIndex((item) => item.arquivo === musica.arquivo);
    const item = document.createElement('article');
    item.className = 'item';
    item.dataset.indice = indiceOriginal;

    const nome = document.createElement('strong');
    nome.textContent = musica.nome;

    const download = document.createElement('button');
    download.className = 'download';
    download.textContent = 'Download';
    download.addEventListener('click', (evento) => {
      evento.stopPropagation();
      const link = document.createElement('a');
      link.href = `Músicas/${musica.arquivo}`;
      link.download = musica.arquivo;
      link.click();
    });

    item.addEventListener('click', () => {
      const indiceListaFiltrada = musicaFiltrada.findIndex((m) => m.arquivo === musica.arquivo);
      tocarIndice(indiceListaFiltrada);
    });

    item.append(nome, download);
    listaMusicas.appendChild(item);
  });

  marcarAtivo();
};

const renderTextos = async () => {
  listaTextos.innerHTML = '';
  const titulo = document.getElementById('texto-titulo');
  const conteudo = document.getElementById('texto-conteudo');
  const visualizador = document.getElementById('visualizador-texto');

  for (const texto of textos) {
    const item = document.createElement('article');
    item.className = 'item';
    item.innerHTML = `<strong>${texto.nome}</strong>`;

    item.addEventListener('click', async () => {
      const resposta = await fetch(texto.arquivo);
      const json = await resposta.json();
      titulo.textContent = json.titulo;
      conteudo.textContent = json.conteudo;
      visualizador.classList.remove('oculto');
    });

    listaTextos.appendChild(item);
  }
};

const renderVideos = () => {
  listaVideos.innerHTML = '';
  videos.forEach((video) => {
    const item = document.createElement('article');
    item.className = 'item';
    item.innerHTML = `<strong>${video.nome}</strong><span>Abrir</span>`;
    item.addEventListener('click', () => {
      const novaJanela = window.open('', '_blank', 'width=900,height=600');
      if (!novaJanela) return;
      novaJanela.document.write(`
        <html><head><title>${video.nome}</title></head>
        <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;">
          <video src="${video.arquivo}" controls autoplay style="max-width:100vw;max-height:100vh"></video>
        </body></html>
      `);
    });
    listaVideos.appendChild(item);
  });
};

document.querySelectorAll('[data-destino]').forEach((botao) => {
  botao.addEventListener('click', () => mostrarSecao(botao.dataset.destino));
});

pesquisa.addEventListener('input', () => {
  const termo = normalizar(pesquisa.value);
  musicaFiltrada = musicas.filter((musica) => normalizar(musica.nome).includes(termo));
  renderMusicas();
});

btnPausar.addEventListener('click', () => {
  if (audio.paused) audio.play();
  else audio.pause();
  atualizarBotoes();
});

btnProxima.addEventListener('click', () => {
  if (!musicaFiltrada.length) return;
  const atual = musicaFiltrada.findIndex((m) => m.arquivo === musicas[indiceAtual]?.arquivo);
  const proxima = atual >= 0 ? (atual + 1) % musicaFiltrada.length : 0;
  tocarIndice(proxima);
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  barraProgresso.value = String((audio.currentTime / audio.duration) * 100);
});

barraProgresso.addEventListener('input', () => {
  if (!audio.duration) return;
  audio.currentTime = (Number(barraProgresso.value) / 100) * audio.duration;
});

audio.addEventListener('ended', () => btnProxima.click());
audio.addEventListener('play', atualizarBotoes);
audio.addEventListener('pause', atualizarBotoes);

renderMusicas();
renderTextos();
renderVideos();
mostrarSecao('home');
