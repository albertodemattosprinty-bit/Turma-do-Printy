const baseUrl = 'https://pub-1208463a3c774431bf7e0ddcbd3cf670.r2.dev/musicas/';

const nomes = [
  'A chegada do bebê.mp3',
  'Em nós.mp3',
  'Feliz ano novo.mp3',
  'Flechas na mão do valente.mp3',
  'Foi por mim, mãe.mp3',
  'Foi pra me salvar.mp3',
  'Gratidão.mp3',
  'Inexplicável Amor.mp3',
  'Mãe, você não vai acreditar.mp3',
  'Nasceu o salvador.mp3',
  'Pequena Belém.mp3',
  'Pertinho do Salvador.mp3',
  'Presente do Senhor.mp3',
  'Reflexo do amor.mp3',
  'Só pra te dizer.mp3',
  'Te amo mãe.mp3',
  'Tua vida me ensina.mp3',
  'Vamos proclamar.mp3',
  'Você.mp3'
];

export const musicas = nomes.map((nome) => ({
  arquivo: `${baseUrl}${encodeURIComponent(nome)}`,
  nome
}));
