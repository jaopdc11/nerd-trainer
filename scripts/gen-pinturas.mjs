/**
 * Baixa do Wikimedia Commons as reproduções dos quadros que estão em domínio
 * público, e escreve `public/pinturas/<id>.jpg`.
 *
 * **Duas origens, e a diferença importa.** No Brasil a obra entra em domínio
 * público 70 anos depois da morte do autor (Lei 9.610/98, art. 41). As 22 obras
 * de `PUBLICAS` já entraram, e por isso estão no Wikimedia Commons, que só
 * aceita conteúdo livre. As 16 de `PROTEGIDAS` **não entraram** — Tarsila morreu
 * em 1973, Portinari em 1962, Di Cavalcanti em 1976, Anita Malfatti em 1964,
 * Picasso em 1973, Magritte em 1967, Dalí em 1989 — e é por isso que elas não
 * existem no Commons: só nas Wikipédias, em baixa resolução, sob a política de
 * uso não-livre de cada uma.
 *
 * O dono do app decidiu incluí-las mesmo assim, ciente disso, e a decisão está
 * registrada aqui porque quem mexer neste arquivo amanhã precisa saber o que
 * está distribuindo: reprodução de obra protegida, em baixa resolução, num app
 * educacional aberto. O caminho de volta é apagar a tabela `PROTEGIDAS` — o
 * dataset já trata `imagem` como opcional e a carta volta a ser o título.
 *
 * A lista de arquivos é escrita à mão, e não resolvida por busca automática:
 * "O Beijo" devolve Klimt, Munch e Rodin, e uma busca que erra silenciosamente
 * põe o quadro errado na carta — o defeito mais caro possível num jogo que
 * cobra autoria. O script confere o que baixou (tamanho e tipo) e o teste do
 * dataset confere que todo id com `imagem` tem arquivo no disco.
 *
 * As reproduções são fotografias de obras planas em domínio público, que não
 * geram direito novo (Bridgeman v. Corel, e a própria política do Commons).
 * Ainda assim o crédito vai no dataset, porque é o certo.
 *
 * Uso: node scripts/gen-pinturas.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')
const DESTINO = join(RAIZ, 'public/pinturas')

/** A política do Wikimedia exige agente identificável. */
const AGENTE = 'nerd-trainer/1.0 (https://github.com/jaopdc11/nerd-trainer)'

/** Largura do thumb. 640 basta para reconhecer e é leve o suficiente. */
const LARGURA = 640

/**
 * id do quadro → arquivo no Commons, sem o prefixo `File:`.
 *
 * Só os que estão em domínio público. O nome é o do arquivo, copiado do
 * Commons, e a conferência é visual: depois de baixar, monte a folha de contato
 * e olhe. Nome parecido baixa quadro parecido.
 */
const PUBLICAS = {
  // --- Brasil do século XIX, todos em domínio público ------------------------
  independencia: 'Pedro Américo - Independência ou Morte - Google Art Project.jpg',
  'primeira-missa': 'Meirelles-primeiramissa2.jpg',
  moema: 'Victor Meirelles - Moema.jpg',
  // A do Google Art Project, e não a `Caipira picando fumo.jpg` solta: aquela é
  // um registro de menor resolução, e o estudo de 1893 é outro quadro.
  caipira: 'Almeida Júnior - Caipira Cutting Tobacco - Google Art Project.jpg',

  // --- renascimento e barroco ------------------------------------------------
  'mona-lisa': 'Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg',
  'ultima-ceia': 'Leonardo da Vinci (1452-1519) - The Last Supper (1495-1498).jpg',
  'criacao-adao': "Michelangelo - Creation of Adam (cropped).jpg",
  'nascimento-venus': 'Sandro Botticelli - La nascita di Venere - Google Art Project - edited.jpg',
  'escola-atenas': '"The School of Athens" by Raffaello Sanzio da Urbino.jpg',
  'jardim-delicias': 'The Garden of earthly delights.jpg',
  'ronda-noturna': 'The Night Watch - HD.jpg',
  'as-meninas': 'Las Meninas, by Diego Velázquez, from Prado in Google Earth.jpg',
  'brinco-perola': 'Meisje met de parel.jpg',

  // --- século XIX -------------------------------------------------------------
  'tres-maio': 'El Tres de Mayo, by Francisco de Goya, from Prado thin black margin.jpg',
  liberdade: 'Eugène Delacroix - Le 28 Juillet. La Liberté guidant le peuple.jpg',
  onda: 'Tsunami by hokusai 19th century.jpg',
  impressao: 'Monet - Impression, Sunrise.jpg',
  girassois: 'Vincent Willem van Gogh 127.jpg',
  'noite-estrelada': 'Van Gogh - Starry Night - Google Art Project.jpg',
  grito: 'Edvard Munch, 1893, The Scream, oil, tempera and pastel on cardboard, 91 x 73 cm, National Gallery of Norway.jpg',
  'beijo-klimt': 'The Kiss - Gustav Klimt - Google Cultural Institute.jpg',
}

/**
 * id do quadro → artigo que ilustra a obra, em ordem de tentativa.
 *
 * As protegidas não têm arquivo no Commons, então o caminho é a imagem
 * principal do artigo (`prop=pageimages`), que cada Wikipédia hospeda em baixa
 * resolução. Vem em ordem porque o artigo em português é o certo para o
 * modernismo brasileiro e o inglês é o único que existe para Magritte.
 */
const PROTEGIDAS = {
  // Cinco continuam sem imagem, e cada uma por um motivo medido:
  //
  // `antropofagia`, `cafe` e `homem-amarelo` não têm reprodução em lugar nenhum
  // do Wikimedia nem no acervo do MAC — procuradas por arquivo e por artigo em
  // pt, en e es.
  //
  // `retirantes` e `guerra-e-paz` TÊM arquivo no Commons, e é pior: o de
  // Retirantes é uma foto da parede do MASP com o quadro de viés, e os de Guerra
  // e Paz são fotos de um evento do Ministério da Cultura — um deles é um homem
  // de terno num palco. Foram baixados, olhados e descartados. Carta com a
  // imagem errada é pior que carta sem imagem, ainda mais num jogo de autoria.
  abaporu: [['pt', 'Abaporu']],
  operarios: [['pt', 'Operários (pintura)'], ['pt', 'Operários']],
  lavrador: [['pt', 'O Lavrador de Café']],
  'cinco-mocas': [['pt', 'Cinco Moças de Guaratinguetá']],
  samba: [['pt', 'Samba (pintura)'], ['pt', 'Samba (Di Cavalcanti)']],
  senhoritas: [['en', "Les Demoiselles d'Avignon"], ['pt', 'Les Demoiselles d\'Avignon']],
  persistencia: [['pt', 'A Persistência da Memória']],
}

/**
 * id → arquivo hospedado na própria Wikipédia em inglês.
 *
 * O caminho do artigo (`PROTEGIDAS`) não serve para estas três: `pageimages`
 * devolve a primeira imagem *livre* da página, e em "Guernica (Picasso)" isso é
 * uma foto das ruínas da cidade bombardeada — quadro errado, e errado de um
 * jeito que passa despercebido. Aqui o arquivo é nomeado.
 */
const LOCAIS_EN = {
  guernica: 'PicassoGuernica.jpg',
  'coluna-partida': 'The Broken Column.jpg',
  'filho-homem': 'Magritte TheSonOfMan.jpg',
}

/**
 * id → imagem no acervo digital do MAC USP.
 *
 * Duas obras que o Wikimedia não tem em lugar nenhum, e que o museu que as
 * guarda publica no próprio acervo online. O link é o do arquivo `_large`, que
 * é o maior que o acervo serve; a conferência foi feita pela ficha do objeto
 * (número de catálogo e autoria), não pelo nome do arquivo, que é um hash.
 */
const MAC_USP = {
  // A negra, 1923 — objeto 17156, catálogo 1963.3.391
  'a-negra':
    'https://acervo.mac.usp.br/acervo/media/collectiveaccess/images/2/53199_ca_object_representations_media_270_large.jpg',
  // A boba, 1915-16 — objeto 17330, catálogo 1963.3.566
  'a-boba':
    'https://acervo.mac.usp.br/acervo/media/collectiveaccess/images/3/76058_ca_object_representations_media_313_large.jpg',
}

async function baixarUrl(id, url) {
  const buf = Buffer.from(
    await fetch(url, { headers: { 'User-Agent': AGENTE } }).then((r) => r.arrayBuffer()),
  )
  if (buf.length < 5_000 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error(`${id}: veio ${buf.length} bytes que não são JPEG`)
  }
  writeFileSync(join(DESTINO, `${id}.jpg`), buf)
  return buf.length
}

/** A imagem principal de um artigo, na largura pedida. */
async function doArtigo(wiki, titulo) {
  const api = new URL(`https://${wiki}.wikipedia.org/w/api.php`)
  api.searchParams.set('action', 'query')
  api.searchParams.set('titles', titulo)
  api.searchParams.set('prop', 'pageimages')
  api.searchParams.set('piprop', 'thumbnail')
  api.searchParams.set('pithumbsize', String(LARGURA))
  api.searchParams.set('format', 'json')

  const meta = await fetch(api, { headers: { 'User-Agent': AGENTE } }).then((r) => r.json())
  const pagina = Object.values(meta?.query?.pages ?? {})[0]
  return pagina?.thumbnail?.source ?? null
}

async function baixarProtegida(id, tentativas) {
  for (const [wiki, titulo] of tentativas) {
    const url = await doArtigo(wiki, titulo)
    if (!url) continue
    const buf = Buffer.from(
      await fetch(url, { headers: { 'User-Agent': AGENTE } }).then((r) => r.arrayBuffer()),
    )
    // Wikipédia serve PNG em alguns artigos; aceita os dois marcadores.
    const jpeg = buf[0] === 0xff && buf[1] === 0xd8
    const png = buf[0] === 0x89 && buf[1] === 0x50
    if (buf.length < 5_000 || (!jpeg && !png)) continue
    writeFileSync(join(DESTINO, `${id}.${jpeg ? 'jpg' : 'png'}`), buf)
    return { bytes: buf.length, ext: jpeg ? 'jpg' : 'png', fonte: `${wiki}:${titulo}` }
  }
  throw new Error(`${id}: nenhum artigo tinha imagem`)
}

async function baixar(id, arquivo, wiki = 'commons.wikimedia.org') {
  const api = new URL(`https://${wiki}/w/api.php`)
  api.searchParams.set('action', 'query')
  api.searchParams.set('titles', `File:${arquivo}`)
  api.searchParams.set('prop', 'imageinfo')
  api.searchParams.set('iiprop', 'url')
  api.searchParams.set('iiurlwidth', String(LARGURA))
  api.searchParams.set('format', 'json')

  const meta = await fetch(api, { headers: { 'User-Agent': AGENTE } }).then((r) => r.json())
  const paginas = Object.values(meta?.query?.pages ?? {})
  const info = paginas[0]?.imageinfo?.[0]

  if (!info?.thumburl) throw new Error(`${id}: ${wiki} não tem "File:${arquivo}"`)

  const bytes = await fetch(info.thumburl, { headers: { 'User-Agent': AGENTE } }).then((r) =>
    r.arrayBuffer(),
  )

  // Guarda contra o erro silencioso: página de erro em HTML tem poucos KB e não
  // começa com o marcador JPEG.
  const buf = Buffer.from(bytes)
  if (buf.length < 10_000 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error(`${id}: veio ${buf.length} bytes que não são JPEG`)
  }

  writeFileSync(join(DESTINO, `${id}.jpg`), buf)
  return buf.length
}

if (!existsSync(DESTINO)) mkdirSync(DESTINO, { recursive: true })

let total = 0
const falhas = []

for (const [id, arquivo] of Object.entries(PUBLICAS)) {
  try {
    const bytes = await baixar(id, arquivo)
    total += bytes
    console.log(`${id.padEnd(18)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  commons`)
  } catch (erro) {
    falhas.push(`${id}: ${erro.message}`)
  }
}

for (const [id, arquivo] of Object.entries(LOCAIS_EN)) {
  try {
    const bytes = await baixar(id, arquivo, 'en.wikipedia.org')
    total += bytes
    console.log(`${id.padEnd(18)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  en.wikipedia`)
  } catch (erro) {
    falhas.push(`${id}: ${erro.message}`)
  }
}

for (const [id, url] of Object.entries(MAC_USP)) {
  try {
    const bytes = await baixarUrl(id, url)
    total += bytes
    console.log(`${id.padEnd(18)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  acervo MAC USP`)
  } catch (erro) {
    falhas.push(`${id}: ${erro.message}`)
  }
}

for (const [id, tentativas] of Object.entries(PROTEGIDAS)) {
  try {
    const { bytes, ext, fonte } = await baixarProtegida(id, tentativas)
    total += bytes
    console.log(`${id.padEnd(18)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${fonte} (.${ext})`)
  } catch (erro) {
    falhas.push(`${id}: ${erro.message}`)
  }
}

const quantos =
  Object.keys(PUBLICAS).length +
  Object.keys(LOCAIS_EN).length +
  Object.keys(MAC_USP).length +
  Object.keys(PROTEGIDAS).length
console.log(`\n${quantos - falhas.length} de ${quantos} imagens, ${(total / 1024 / 1024).toFixed(1)} MB`)
if (falhas.length) {
  console.error(`\n${falhas.length} falharam:`)
  for (const f of falhas) console.error(`  ${f}`)
  process.exit(1)
}
