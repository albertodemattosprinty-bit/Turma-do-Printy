import { musicas as musicasFallback } from './Músicas.js';
import { textos as textosFallback } from './Textos.js';
import { videos as videosFallback } from './Vídeos.js';

const secoes = [...document.querySelectorAll('.secao')];
const listaMusicas = document.getElementById('lista-musicas');
const listaTextos = document.getElementById('lista-textos');
const listaVideos = document.getElementById('lista-videos');
const pesquisa = document.getElementById('pesquisa');
const btnTogglePesquisa = document.getElementById('btn-toggle-pesquisa');
const playerFixo = document.getElementById('player-fixo');
const musicaAtual = document.getElementById('musica-atual');
const barraProgresso = document.getElementById('barra-progresso');
const btnPausar = document.getElementById('btn-pausar');
const btnAnterior = document.getElementById('btn-anterior');
const btnProxima = document.getElementById('btn-proxima');
const btnVolume = document.getElementById('btn-volume');
const btnCompartilhar = document.getElementById('btn-compartilhar');

const iconePausar = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z" /></svg>`;
const iconeTocar = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>`;
const iconeVolume = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3.2 8.4 8H4v8h4.4L14 20.8V3.2zm3.5 4.3-1.4 1.4a4 4 0 0 1 0 6.2l1.4 1.4a6 6 0 0 0 0-9z"/></svg>`;
const iconeMudo = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3.2 8.4 8H4v8h4.4L14 20.8V3.2zm6 4.2L18.6 6 16 8.6 13.4 6 12 7.4 14.6 10 12 12.6l1.4 1.4 2.6-2.6 2.6 2.6 1.4-1.4-2.6-2.6L20 7.4z"/></svg>`;

const audio = new Audio();
let indiceAtual = -1;
let musicas = [...musicasFallback];
let textos = [...textosFallback];
let videos = [...videosFallback];
let musicaFiltrada = [...musicas];
let textosFiltrados = [...textos];
let videosFiltrados = [...videos];

const normalizar = (valor) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\W_]+/g, '')
    .toLowerCase();

const nomeAmigavel = (arquivo) => arquivo.replace(/\.[^.]+$/i, '').replace(/[-_]/g, ' ');

const coletarArquivosDoHTML = (html, pasta, extensoesAceitas) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const links = [...doc.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href'))
    .filter(Boolean)
    .map((href) => decodeURIComponent(href.split('?')[0]))
    .filter((href) => !href.endsWith('/'))
    .map((href) => href.split('/').pop())
    .filter((arquivo) => extensoesAceitas.some((ext) => arquivo.toLowerCase().endsWith(ext)));

  return [...new Set(links)].map((arquivo) => ({
    arquivo: `${pasta}/${arquivo}`,
    nome: nomeAmigavel(arquivo)
  }));
};

const carregarListaDinamica = async (pasta, extensoesAceitas) => {
  try {
    const resposta = await fetch(`${pasta}/`, { cache: 'no-store' });
    if (!resposta.ok) throw new Error('Sem listagem de diretório');
    const html = await resposta.text();
    return coletarArquivosDoHTML(html, pasta, extensoesAceitas);
  } catch {
    return [];
  }
};

const carregarMusicasDoJson = async () => {
  try {
    const resposta = await fetch('musicas.json', { cache: 'no-store' });
    if (!resposta.ok) throw new Error('JSON de músicas indisponível');

    const lista = await resposta.json();
    if (!Array.isArray(lista)) throw new Error('Formato inválido');

    return lista
      .filter((item) => item && typeof item.nome === 'string' && typeof item.link === 'string')
      .map((item) => ({ nome: item.nome, arquivo: item.link }));
  } catch {
    return [...musicasFallback];
  }
};

const listasMudaram = (listaAtual, novaLista) => {
  const atual = listaAtual.map((item) => item.arquivo).sort().join('|');
  const nova = novaLista.map((item) => item.arquivo).sort().join('|');
  return atual !== nova;
};

const aplicarFiltroGlobal = () => {
  const termo = normalizar(pesquisa.value || '');
  musicaFiltrada = musicas.filter((musica) => normalizar(musica.nome).includes(termo));
  textosFiltrados = textos.filter((texto) => normalizar(texto.nome).includes(termo));
  videosFiltrados = videos.filter((video) => normalizar(video.nome).includes(termo));
};

const mostrarSecao = (id) => {
  secoes.forEach((secao) => secao.classList.toggle('ativa', secao.id === id));
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
  audio.src = musica.arquivo;
  audio.play();
  musicaAtual.textContent = musica.nome;
  playerFixo.classList.remove('oculto');
  atualizarBotoes();
  marcarAtivo();
};

const atualizarBotoes = () => {
  const pausado = audio.paused;
  btnPausar.innerHTML = pausado ? iconeTocar : iconePausar;
  btnPausar.setAttribute('aria-label', pausado ? 'Tocar música' : 'Pausar música');
  btnVolume.innerHTML = audio.muted ? iconeMudo : iconeVolume;
  btnVolume.setAttribute('aria-label', audio.muted ? 'Ativar volume' : 'Silenciar');
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
    download.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v9h3l-4 5-4-5h3z" /><path d="M5 19h14v2H5z" /></svg>`;
    download.setAttribute('aria-label', `Baixar ${musica.nome}`);
    download.addEventListener('click', (evento) => {
      evento.stopPropagation();
      const link = document.createElement('a');
      link.href = musica.arquivo;
      link.download = musica.arquivo.split('/').pop();
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

const obterConteudoTexto = async (arquivo) => {
  if (arquivo.toLowerCase().endsWith('.json')) {
    const resposta = await fetch(arquivo, { cache: 'no-store' });
    const json = await resposta.json();
    return {
      titulo: json.titulo || nomeAmigavel(arquivo.split('/').pop()),
      conteudo: json.conteudo || JSON.stringify(json, null, 2)
    };
  }

  const resposta = await fetch(arquivo, { cache: 'no-store' });
  const conteudo = await resposta.text();
  return { titulo: nomeAmigavel(arquivo.split('/').pop()), conteudo };
};

const renderTextos = async () => {
  listaTextos.innerHTML = '';
  const titulo = document.getElementById('texto-titulo');
  const conteudo = document.getElementById('texto-conteudo');
  const visualizador = document.getElementById('visualizador-texto');

  visualizador.classList.add('oculto');
  for (const texto of textosFiltrados) {
    const item = document.createElement('article');
    item.className = 'item';
    item.innerHTML = `<strong>${texto.nome}</strong>`;

    item.addEventListener('click', async () => {
      const textoCarregado = await obterConteudoTexto(texto.arquivo);
      titulo.textContent = textoCarregado.titulo;
      conteudo.textContent = textoCarregado.conteudo;
      visualizador.classList.remove('oculto');
    });

    listaTextos.appendChild(item);
  }
};

const renderVideos = () => {
  listaVideos.innerHTML = '';
  videosFiltrados.forEach((video) => {
    const item = document.createElement('article');
    item.className = 'item';
    item.innerHTML = `<strong>${video.nome}</strong><span>Abrir</span>`;
    item.addEventListener('click', () => {
      const novaJanela = window.open('', '_blank', 'width=900,height=600');
      if (!novaJanela) return;
      novaJanela.document.write(`<html><head><title>${video.nome}</title></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;"><video src="${video.arquivo}" controls autoplay style="max-width:100vw;max-height:100vh"></video></body></html>`);
    });
    listaVideos.appendChild(item);
  });
};

const carregarConteudo = async (forcarRender = false) => {
  const musicasDoJson = await carregarMusicasDoJson();
  const videosDinamicos = await carregarListaDinamica('Vídeos', ['.mp4', '.webm', '.mov']);
  const textosDinamicos = await carregarListaDinamica('Textos', ['.json', '.txt', '.rtf']);

  const novasMusicas = musicasDoJson;
  const novosVideos = videosDinamicos.length ? videosDinamicos : videosFallback;
  const novosTextos = textosDinamicos.length ? textosDinamicos : textosFallback;

  const alterouMusicas = listasMudaram(musicas, novasMusicas);
  const alterouVideos = listasMudaram(videos, novosVideos);
  const alterouTextos = listasMudaram(textos, novosTextos);

  musicas = novasMusicas;
  videos = novosVideos;
  textos = novosTextos;

  if (forcarRender || alterouMusicas || alterouVideos || alterouTextos) {
    aplicarFiltroGlobal();
    renderMusicas();
    await renderTextos();
    renderVideos();
  }
};

document.querySelectorAll('[data-destino]').forEach((botao) => {
  botao.addEventListener('click', () => mostrarSecao(botao.dataset.destino));
});

btnTogglePesquisa.addEventListener('click', () => {
  pesquisa.classList.toggle('oculto');
  if (!pesquisa.classList.contains('oculto')) pesquisa.focus();
});

pesquisa.addEventListener('input', async () => {
  aplicarFiltroGlobal();
  renderMusicas();
  await renderTextos();
  renderVideos();
});

btnPausar.addEventListener('click', () => {
  if (audio.paused) audio.play();
  else audio.pause();
  atualizarBotoes();
});

btnAnterior.addEventListener('click', () => {
  if (!musicaFiltrada.length) return;
  const atual = musicaFiltrada.findIndex((m) => m.arquivo === musicas[indiceAtual]?.arquivo);
  const anterior = atual > 0 ? atual - 1 : musicaFiltrada.length - 1;
  tocarIndice(anterior);
});

btnProxima.addEventListener('click', () => {
  if (!musicaFiltrada.length) return;
  const atual = musicaFiltrada.findIndex((m) => m.arquivo === musicas[indiceAtual]?.arquivo);
  const proxima = atual >= 0 ? (atual + 1) % musicaFiltrada.length : 0;
  tocarIndice(proxima);
});

btnVolume.addEventListener('click', () => {
  audio.muted = !audio.muted;
  atualizarBotoes();
});

btnCompartilhar.addEventListener('click', async () => {
  const musica = musicas[indiceAtual];
  if (!musica) return;

  try {
    const resposta = await fetch(musica.arquivo);
    const blob = await resposta.blob();
    const nomeArquivo = musica.arquivo.split('/').pop() || `${musica.nome}.mp3`;
    const arquivo = new File([blob], nomeArquivo, { type: blob.type || 'audio/mpeg' });

    if (navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ title: musica.nome, files: [arquivo], text: `Compartilhando: ${musica.nome}` });
      return;
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    alert('Não foi possível compartilhar esta música agora.');
  }
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

carregarConteudo(true);
setInterval(() => carregarConteudo(), 15000);
mostrarSecao('home');
atualizarBotoes();
