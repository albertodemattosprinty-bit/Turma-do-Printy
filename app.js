import { musicas as musicasFallback } from './Músicas.js';

const audio = new Audio();
const listEl = document.getElementById('music-list');
const searchInput = document.getElementById('search-input');
const nowPlaying = document.getElementById('now-playing');
const nowTitle = document.getElementById('now-title');
const nowSubtitle = document.getElementById('now-subtitle');
const nowCoverSlot = document.getElementById('now-cover-slot');
const nowEq = document.getElementById('now-eq');
const nowPlay = document.getElementById('now-play');
const nowDownload = document.getElementById('now-download');
const progressFill = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const btnBack = document.getElementById('btn-back');

const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg>';
const downloadIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10.2l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4 3.6 3.6zM4 19h16v2H4z"/></svg>';

let musicas = [];
let filtradas = [];
let indiceAtual = -1;

const normalizar = (valor) =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const tituloSemExtensao = (nome) => nome.replace(/\.[^.]+$/i, '');

const corPlaceholder = (texto) => {
  const paleta = ['#5562EA', '#3FA34D', '#C97F2A', '#AC4FA8', '#0C88A8', '#A85252'];
  const indice = [...texto].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % paleta.length;
  return paleta[indice];
};

const montarCapa = (musica, tamanhoGrande = false) => {
  if (musica.imagem) {
    const img = document.createElement('img');
    img.className = 'cover';
    img.alt = `Capa de ${musica.nome}`;
    img.src = musica.imagem;
    img.onerror = () => {
      img.replaceWith(montarCapa({ ...musica, imagem: '' }, tamanhoGrande));
    };
    return img;
  }

  const fallback = document.createElement('div');
  fallback.className = 'cover-fallback';
  fallback.style.background = `linear-gradient(140deg, ${corPlaceholder(musica.nome)}, #1c2230)`;
  fallback.textContent = '♪';
  if (tamanhoGrande) fallback.classList.add('cover');
  return fallback;
};

const baixarMusica = (musica) => {
  const link = document.createElement('a');
  link.href = musica.arquivo;
  link.download = `${musica.nome}.mp3`;
  link.click();
};

const tocarMusica = (musica) => {
  const idxOriginal = musicas.findIndex((m) => m.arquivo === musica.arquivo);
  if (idxOriginal < 0) return;

  if (indiceAtual === idxOriginal && !audio.paused) {
    audio.pause();
    atualizarEstado();
    return;
  }

  indiceAtual = idxOriginal;
  audio.src = musica.arquivo;
  audio.play();

  nowTitle.textContent = musica.nome;
  nowSubtitle.textContent = musica.artista || 'iTalk Collection';
  nowCoverSlot.innerHTML = "";
  nowCoverSlot.appendChild(montarCapa(musica, true));
  nowPlaying.classList.remove('oculto');
  atualizarEstado();
};

const criarCard = (musica) => {
  const card = document.createElement('div');
  card.className = 'card';

  const capa = montarCapa(musica);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<div class="title">${musica.nome}</div><div class="subtitle">${musica.artista || 'iTalk Collection'}</div>`;

  const trailing = document.createElement('div');
  trailing.className = 'trailing';

  const eq = document.createElement('div');
  eq.className = 'equalizer-mini oculto';
  eq.innerHTML = '<span></span><span></span><span></span><span></span>';

  const play = document.createElement('button');
  play.className = 'play-pill';
  play.innerHTML = playIcon;
  play.setAttribute('aria-label', `Tocar ${musica.nome}`);

  play.addEventListener('click', (event) => {
    event.stopPropagation();
    tocarMusica(musica);
  });

  card.addEventListener('click', () => tocarMusica(musica));
  trailing.append(eq, play);
  card.append(capa, meta, trailing);
  card.dataset.arquivo = musica.arquivo;
  return card;
};

const renderLista = () => {
  listEl.innerHTML = '';
  filtradas.forEach((musica) => listEl.appendChild(criarCard(musica)));
  atualizarEstado();
};

const atualizarEstado = () => {
  nowPlay.innerHTML = audio.paused ? playIcon : pauseIcon;
  nowDownload.innerHTML = downloadIcon;

  const atual = musicas[indiceAtual];
  const tocando = atual && !audio.paused;

  document.querySelectorAll('.card').forEach((card) => {
    const ativa = card.dataset.arquivo === atual?.arquivo;
    card.querySelector('.equalizer-mini')?.classList.toggle('oculto', !(ativa && tocando));
    card.querySelector('.play-pill').innerHTML = ativa && tocando ? pauseIcon : playIcon;
  });

  nowEq.classList.toggle('oculto', !tocando);
};

const aplicarFiltro = () => {
  const termo = normalizar(searchInput.value || '');
  filtradas = musicas.filter((m) => normalizar(m.nome).includes(termo));
  renderLista();
};

const carregarMusicas = async () => {
  try {
    const resposta = await fetch('musicas.json', { cache: 'no-store' });
    if (!resposta.ok) throw new Error('musicas.json indisponível');
    const lista = await resposta.json();
    musicas = lista
      .filter((item) => item?.nome && item?.link)
      .map((item) => ({
        nome: tituloSemExtensao(item.nome),
        arquivo: item.link,
        imagem: item.imagem || '',
        artista: item.artista || 'iTalk Collection'
      }));
  } catch {
    musicas = musicasFallback.map((musica) => ({
      nome: tituloSemExtensao(musica.nome),
      arquivo: musica.arquivo,
      imagem: musica.imagem || '',
      artista: 'iTalk Collection'
    }));
  }

  filtradas = [...musicas];
  renderLista();
};

searchInput.addEventListener('input', aplicarFiltro);
nowPlay.addEventListener('click', () => {
  if (!audio.src && filtradas[0]) {
    tocarMusica(filtradas[0]);
    return;
  }

  if (audio.paused) audio.play();
  else audio.pause();
  atualizarEstado();
});

nowDownload.addEventListener('click', () => {
  const atual = musicas[indiceAtual];
  if (atual) baixarMusica(atual);
});

btnBack.addEventListener('click', () => history.back());

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = `${percent}%`;
  progressThumb.style.left = `${percent}%`;
});

audio.addEventListener('play', atualizarEstado);
audio.addEventListener('pause', atualizarEstado);
audio.addEventListener('ended', () => {
  if (!filtradas.length) return;
  const atual = filtradas.findIndex((m) => m.arquivo === musicas[indiceAtual]?.arquivo);
  const proxima = filtradas[(atual + 1) % filtradas.length];
  tocarMusica(proxima);
});

carregarMusicas();
