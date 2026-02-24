export const musicas = [
  'A chegada do bebê.mp3',
  'Foi por mim, mãe.mp3',
  'Foi pra me salvar.mp3',
  'Inexplicável Amor.mp3',
  'Mãe, você não vai acreditar.mp3',
  'Pertinho do Salvador.mp3',
  'Presente do Senhor.mp3',
  'Só pra te dizer.mp3',
  'Te amo mãe.mp3',
  'Você.mp3'
].map((arquivo) => ({
  arquivo: `Músicas/${arquivo}`,
  nome: arquivo.replace(/\.mp3$/i, '')
}));
