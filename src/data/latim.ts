/**
 * Expressões em latim que ainda circulam em português.
 *
 * **O que está sendo cobrado é o uso, não a etimologia.** Por isso cada item tem
 * dois campos de tradução, e eles não são redundantes: `literal` é o que as
 * palavras dizem, `significado` é o que a expressão faz quando alguém a escreve.
 * "Habeas corpus" ao pé da letra é "que tenhas o corpo", o que não ajuda ninguém
 * a entender uma manchete; o que se cobra é que é a ordem de apresentar o preso
 * ao juiz. Guardar só o literal seria ensinar latim; guardar só o significado
 * seria esconder por que a expressão é essa e não outra. O jogo pergunta o
 * significado e devolve o literal no gabarito.
 *
 * **O significado é uma linha e tem de ser autossuficiente.** Ele vira alternativa
 * de múltipla escolha, inclusive alternativa *errada* de outras cartas, então não
 * pode depender de contexto nem começar com "quando...". Onde a expressão tem
 * mais de um uso, o registrado é o que aparece em texto corrente — não o sentido
 * técnico que só vale num ramo do direito.
 *
 * **`dominio` não é enfeite de catalogação: é a segunda fonte de distratores.** Se
 * as opções erradas vierem de qualquer lugar, "in dubio pro reo" se resolve por
 * tom — três frases de citação acadêmica e uma frase de processo penal, e nem
 * precisa saber latim. Com todas do mesmo domínio, a carta volta a medir a
 * expressão.
 */
export type Dominio = 'jurídico' | 'filosófico' | 'acadêmico' | 'corrente'

export const DOMINIOS: readonly Dominio[] = ['jurídico', 'filosófico', 'acadêmico', 'corrente']

export interface Expressao {
  readonly id: string
  /** Como se escreve. É a pergunta. */
  readonly expressao: string
  /** O que ela quer dizer em uso, numa linha. É a resposta. */
  readonly significado: string
  /** Ao pé da letra. Vai para o gabarito, nunca para as alternativas. */
  readonly literal: string
  readonly dominio: Dominio
}

export const EXPRESSOES: readonly Expressao[] = [
  // --- jurídico -------------------------------------------------------------
  { id: 'habeas-corpus', expressao: 'habeas corpus', significado: 'a ordem para que o preso seja apresentado ao juiz: a garantia contra prisão ilegal', literal: 'que tenhas o corpo', dominio: 'jurídico' },
  { id: 'data-venia', expressao: 'data venia', significado: 'com a devida licença — a fórmula de quem vai discordar com respeito', literal: 'dada a vênia', dominio: 'jurídico' },
  { id: 'in-dubio-pro-reo', expressao: 'in dubio pro reo', significado: 'na dúvida, decide-se a favor do réu', literal: 'na dúvida, pelo réu', dominio: 'jurídico' },
  { id: 'ex-nunc', expressao: 'ex nunc', significado: 'com efeito só de agora em diante: o que passou fica de pé', literal: 'desde agora', dominio: 'jurídico' },
  { id: 'ex-tunc', expressao: 'ex tunc', significado: 'com efeito retroativo: apaga também o que já tinha acontecido', literal: 'desde então', dominio: 'jurídico' },
  { id: 'rebus-sic-stantibus', expressao: 'rebus sic stantibus', significado: 'o contrato vale enquanto as circunstâncias continuarem as mesmas', literal: 'estando as coisas assim', dominio: 'jurídico' },
  { id: 'pacta-sunt-servanda', expressao: 'pacta sunt servanda', significado: 'o que foi combinado tem de ser cumprido', literal: 'os pactos devem ser observados', dominio: 'jurídico' },
  { id: 'ad-hoc', expressao: 'ad hoc', significado: 'feito para este caso e só para ele, sem virar regra', literal: 'para isto', dominio: 'jurídico' },
  { id: 'ad-referendum', expressao: 'ad referendum', significado: 'decidido agora, mas dependendo de aprovação posterior', literal: 'para ser referendado', dominio: 'jurídico' },
  { id: 'bis-in-idem', expressao: 'bis in idem', significado: 'punir ou cobrar duas vezes pelo mesmo fato', literal: 'duas vezes sobre a mesma coisa', dominio: 'jurídico' },
  { id: 'erga-omnes', expressao: 'erga omnes', significado: 'que vale contra todos, e não só contra quem estava no processo', literal: 'em relação a todos', dominio: 'jurídico' },
  { id: 'inter-partes', expressao: 'inter partes', significado: 'que vale só entre as partes envolvidas', literal: 'entre as partes', dominio: 'jurídico' },
  { id: 'de-facto', expressao: 'de facto', significado: 'o que existe na prática, tenha ou não respaldo na lei', literal: 'de fato', dominio: 'jurídico' },
  { id: 'de-jure', expressao: 'de jure', significado: 'o que a lei estabelece, valha ou não na prática', literal: 'de direito', dominio: 'jurídico' },
  { id: 'dura-lex-sed-lex', expressao: 'dura lex, sed lex', significado: 'a lei é dura, mas cumpre-se mesmo quando pesa', literal: 'dura lei, mas lei', dominio: 'jurídico' },
  { id: 'pro-bono', expressao: 'pro bono', significado: 'trabalho prestado de graça, no interesse público', literal: 'pelo bem', dominio: 'jurídico' },

  // --- filosófico e lógico --------------------------------------------------
  { id: 'a-priori', expressao: 'a priori', significado: 'o que se sabe antes da experiência, só por raciocínio', literal: 'a partir do anterior', dominio: 'filosófico' },
  { id: 'a-posteriori', expressao: 'a posteriori', significado: 'o que só se sabe depois da experiência', literal: 'a partir do posterior', dominio: 'filosófico' },
  { id: 'ad-hominem', expressao: 'ad hominem', significado: 'atacar quem fala em vez de responder ao que foi dito', literal: 'ao homem', dominio: 'filosófico' },
  { id: 'ad-infinitum', expressao: 'ad infinitum', significado: 'sem parar, repetindo-se indefinidamente', literal: 'até o infinito', dominio: 'filosófico' },
  // Filosófica e não corrente: o nome completo da falácia é *argumentum ad
  // nauseam*, repetir até o outro aceitar. Fica ao lado das outras falácias, que
  // é com quem ela se confunde.
  { id: 'ad-nauseam', expressao: 'ad nauseam', significado: 'repetido até enjoar', literal: 'até a náusea', dominio: 'filosófico' },
  { id: 'reductio-ad-absurdum', expressao: 'reductio ad absurdum', significado: 'provar uma tese mostrando que negá-la leva a um absurdo', literal: 'redução ao absurdo', dominio: 'filosófico' },
  { id: 'non-sequitur', expressao: 'non sequitur', significado: 'a conclusão não decorre das premissas', literal: 'não se segue', dominio: 'filosófico' },
  { id: 'petitio-principii', expressao: 'petitio principii', significado: 'supor na premissa justamente aquilo que se quer provar', literal: 'petição de princípio', dominio: 'filosófico' },
  { id: 'quod-erat-demonstrandum', expressao: 'quod erat demonstrandum', significado: 'como se queria demonstrar: o ponto-final de uma prova', literal: 'o que se queria demonstrar', dominio: 'filosófico' },
  { id: 'a-fortiori', expressao: 'a fortiori', significado: 'com razão ainda mais forte: se vale no caso fraco, vale no forte', literal: 'a partir do mais forte', dominio: 'filosófico' },

  // --- acadêmico ------------------------------------------------------------
  { id: 'apud', expressao: 'apud', significado: 'citado por: você leu na obra de um terceiro, não no original', literal: 'junto a', dominio: 'acadêmico' },
  { id: 'et-al', expressao: 'et al.', significado: 'e outros: os demais autores do trabalho, que não foram nomeados', literal: 'e outros', dominio: 'acadêmico' },
  { id: 'ibidem', expressao: 'ibidem', significado: 'na mesma obra citada logo acima', literal: 'no mesmo lugar', dominio: 'acadêmico' },
  { id: 'idem', expressao: 'idem', significado: 'do mesmo autor da citação anterior', literal: 'o mesmo', dominio: 'acadêmico' },
  { id: 'ipsis-litteris', expressao: 'ipsis litteris', significado: 'exatamente com as mesmas palavras do original', literal: 'pelas mesmas letras', dominio: 'acadêmico' },
  { id: 'in-vitro', expressao: 'in vitro', significado: 'em laboratório, fora do organismo', literal: 'no vidro', dominio: 'acadêmico' },
  { id: 'in-vivo', expressao: 'in vivo', significado: 'no organismo vivo', literal: 'no vivo', dominio: 'acadêmico' },
  { id: 'stricto-sensu', expressao: 'stricto sensu', significado: 'em sentido estrito, tomando o termo pelo seu núcleo', literal: 'em sentido apertado', dominio: 'acadêmico' },
  { id: 'lato-sensu', expressao: 'lato sensu', significado: 'em sentido amplo, incluindo o que está na borda', literal: 'em sentido largo', dominio: 'acadêmico' },
  // Acadêmica e não corrente por causa da vizinhança: "visita in loco" e
  // "pesquisa in loco" moram ao lado de in vitro e in vivo, e é com elas que a
  // expressão se confunde. O domínio existe para achar distrator, não para
  // catalogar bonito.
  { id: 'in-loco', expressao: 'in loco', significado: 'no próprio lugar onde a coisa acontece', literal: 'no lugar', dominio: 'acadêmico' },

  // --- corrente -------------------------------------------------------------
  { id: 'sine-qua-non', expressao: 'sine qua non', significado: 'a condição sem a qual a coisa não acontece', literal: 'sem a qual não', dominio: 'corrente' },
  { id: 'ipso-facto', expressao: 'ipso facto', significado: 'por consequência imediata do próprio fato, sem precisar de mais nada', literal: 'pelo próprio fato', dominio: 'corrente' },
  { id: 'sui-generis', expressao: 'sui generis', significado: 'único no gênero, que não se encaixa em categoria nenhuma', literal: 'de seu próprio gênero', dominio: 'corrente' },
  { id: 'modus-operandi', expressao: 'modus operandi', significado: 'o jeito característico de alguém agir, repetido caso a caso', literal: 'modo de operar', dominio: 'corrente' },
  { id: 'status-quo', expressao: 'status quo', significado: 'o estado em que as coisas estão, e que alguém quer manter', literal: 'o estado no qual', dominio: 'corrente' },
  { id: 'per-se', expressao: 'per se', significado: 'por si mesmo, considerado isoladamente', literal: 'por si', dominio: 'corrente' },
  { id: 'carpe-diem', expressao: 'carpe diem', significado: 'aproveite o dia de hoje, sem contar com o amanhã', literal: 'colhe o dia', dominio: 'corrente' },
  { id: 'alea-jacta-est', expressao: 'alea jacta est', significado: 'a decisão está tomada e não há como voltar atrás', literal: 'a sorte está lançada', dominio: 'corrente' },
  { id: 'persona-non-grata', expressao: 'persona non grata', significado: 'pessoa indesejada, a quem se fecha a porta', literal: 'pessoa não agradável', dominio: 'corrente' },
  { id: 'grosso-modo', expressao: 'grosso modo', significado: 'de modo aproximado, sem entrar na precisão', literal: 'de modo grosseiro', dominio: 'corrente' },
  // As três que qualificam um raciocínio em texto corrente — "tudo o mais
  // constante", "mudado o que precisa mudar", "por alto" — ficam juntas porque é
  // uma pela outra que se troca.
  { id: 'ceteris-paribus', expressao: 'ceteris paribus', significado: 'supondo que todo o resto permaneça constante', literal: 'mantidas iguais as demais coisas', dominio: 'corrente' },
  { id: 'mutatis-mutandis', expressao: 'mutatis mutandis', significado: 'aplicando o mesmo raciocínio, mudado o que precisa mudar', literal: 'mudadas as coisas que devem ser mudadas', dominio: 'corrente' },
  { id: 'memento-mori', expressao: 'memento mori', significado: 'lembre-se de que você vai morrer', literal: 'lembra-te de que morrerás', dominio: 'corrente' },
]

/**
 * As expressões que de fato se confundem entre si — a primeira fonte de
 * distratores.
 *
 * Três critérios para entrar, e nenhum deles é "parece latim":
 *
 * 1. **par opositivo** — as duas existem justamente para se contrapor, e quem sabe
 *    uma tem 50% de chance de trocá-las: `ex nunc` × `ex tunc`, `a priori` ×
 *    `a posteriori`, `de facto` × `de jure`, `stricto sensu` × `lato sensu`,
 *    `erga omnes` × `inter partes`, `in vitro` × `in vivo`. São os melhores
 *    distratores que este baralho tem, e nenhum é invenção minha;
 * 2. **regra e exceção** — `pacta sunt servanda` diz que o contrato se cumpre,
 *    `rebus sic stantibus` diz quando ele deixa de valer. Marcar um pelo outro é
 *    o erro clássico de quem decorou só metade da dupla;
 * 3. **mesma família de uso** — as quatro de citação (`apud`, `idem`, `ibidem`,
 *    `ipsis litteris`), as três falácias, as três máximas sobre o tempo. Aqui a
 *    pessoa sabe o campo e erra o item, que é a confusão que vale treinar.
 *
 * O mapa é simétrico de propósito, e o teste quebra se deixar de ser: "A se
 * confunde com B" e "B se confunde com A" são a mesma afirmação, e uma assimetria
 * seria esquecimento, nunca decisão.
 *
 * Nem toda expressão precisa estar aqui — `modus operandi` e `status quo` não têm
 * par natural, e forçar um seria inventar confusão que ninguém tem. Para essas, o
 * domínio dá os distratores, e o teste garante que todo domínio tem gente
 * suficiente para fechar as quatro opções sem sorteio geral.
 */
export const CONFUNDEM: Readonly<Record<string, readonly string[]>> = {
  // pares opositivos
  'ex-nunc': ['ex-tunc'],
  'ex-tunc': ['ex-nunc'],
  'a-priori': ['a-posteriori'],
  'a-posteriori': ['a-priori'],
  'de-facto': ['de-jure'],
  'de-jure': ['de-facto'],
  'stricto-sensu': ['lato-sensu'],
  'lato-sensu': ['stricto-sensu'],
  'erga-omnes': ['inter-partes'],
  'inter-partes': ['erga-omnes'],
  'in-vitro': ['in-vivo', 'in-loco'],
  'in-vivo': ['in-vitro', 'in-loco'],
  'in-loco': ['in-vivo', 'in-vitro'],

  // regra e exceção, e as duas caras da decisão provisória
  'pacta-sunt-servanda': ['rebus-sic-stantibus'],
  'rebus-sic-stantibus': ['pacta-sunt-servanda'],
  'ad-hoc': ['ad-referendum'],
  'ad-referendum': ['ad-hoc'],
  'in-dubio-pro-reo': ['dura-lex-sed-lex'],
  'dura-lex-sed-lex': ['in-dubio-pro-reo'],
  'habeas-corpus': ['bis-in-idem'],
  'bis-in-idem': ['habeas-corpus'],

  // a família da citação
  apud: ['idem', 'ibidem', 'et-al', 'ipsis-litteris'],
  idem: ['ibidem', 'apud', 'et-al'],
  ibidem: ['idem', 'apud', 'et-al'],
  'et-al': ['apud', 'idem', 'ibidem'],
  'ipsis-litteris': ['apud'],

  // as falácias, e as duas fórmulas de fechar uma prova
  'ad-hominem': ['non-sequitur', 'petitio-principii'],
  'non-sequitur': ['ad-hominem', 'petitio-principii'],
  'petitio-principii': ['non-sequitur', 'ad-hominem'],
  'reductio-ad-absurdum': ['quod-erat-demonstrandum'],
  'quod-erat-demonstrandum': ['reductio-ad-absurdum'],

  // necessidade, suficiência e consequência: o nó mais escorregadio do baralho.
  // `a fortiori` seria o quarto membro natural deste grupo e ficou de fora: ela é
  // filosófica e as três são de uso corrente, e um par que atravessa domínio
  // acaba entregando a carta pelo registro da frase, não pelo sentido. Sem par
  // declarado, ela tira os distratores do próprio domínio, que é o que basta.
  'sine-qua-non': ['ipso-facto', 'per-se'],
  'ipso-facto': ['sine-qua-non', 'per-se'],
  'per-se': ['sine-qua-non', 'ipso-facto'],

  // repetição sem fim
  'ad-infinitum': ['ad-nauseam'],
  'ad-nauseam': ['ad-infinitum'],

  // "mudando o que for preciso" × "mantendo tudo o mais" × "por alto"
  'ceteris-paribus': ['mutatis-mutandis', 'grosso-modo'],
  'mutatis-mutandis': ['ceteris-paribus', 'grosso-modo'],
  'grosso-modo': ['mutatis-mutandis', 'ceteris-paribus'],

  // as máximas sobre o tempo e a decisão
  'carpe-diem': ['memento-mori', 'alea-jacta-est'],
  'memento-mori': ['carpe-diem', 'alea-jacta-est'],
  'alea-jacta-est': ['carpe-diem', 'memento-mori'],
}
