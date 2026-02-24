export const musicas = [
  'A chegada do bebê.mp3',
  'Foi por mim, mãe.mp3',
  'Mãe, você não vai acreditar.mp3',
  'Te amo mãe.mp3',
  'Você.mp3'
].map((arquivo) => ({
  arquivo,
  nome: arquivo.replace(/\.mp3$/i, '')
}));
