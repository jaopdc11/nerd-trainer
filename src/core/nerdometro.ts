import { JOGOS } from './registry'
import type { Banco, Entrada } from './storage'
import { CATEGORIAS } from './types'
import type { Categoria } from './types'

/**
 * A nota de nerd: 0 a 100.
 *
 * O desenho tem cinco decisões que importam:
 *
 * 1. **Cada jogo tem uma meta, não o total.** Decorar 118 elementos vale 100%,
 *    mas ninguém decora 10 mil casas de π — a meta de π é 100 casas, que já é
 *    coisa de gente obsessiva. Usar o total como denominador faria a nota
 *    depender de quantas casas eu resolvi embutir no dataset, o que é arbitrário.
 * 2. **Conhecimento pesa mais que velocidade.** Saber a tabela periódica diz
 *    mais sobre alguém do que somar rápido. A escala está em `ESCALA_DE_PESO`;
 *    o comentário de `CRITERIOS` explica por que peso e meta não são a mesma
 *    alavanca.
 *
 *    Isto foi auditado quando o catálogo saiu de 26 para 69 critérios, e o que
 *    a auditoria achou vale ficar escrito, porque a próxima pessoa a olhar a
 *    tabela vai ter a mesma ideia. Os quatro grandes repertórios (tabela
 *    periódica, países, bandeiras, capitais) caíram de 31,7% para 12,4% do peso
 *    **somado do catálogo**. Parece a nota ter mudado de assunto sozinha, e não
 *    é: esse total não aparece na fórmula. O denominador é o dos jogos
 *    *jogados* (decisão 3), então a fatia que alguém sente é a do próprio
 *    banco — no banco real do dono do app, os quatro grandes são 31,2% da nota,
 *    o mesmo de quando havia 26 jogos. Os 12,4% só valem para quem jogou os 69.
 *
 *    Subir a escala foi medido e descartado: para devolver os 31,7% *do
 *    catálogo* hoje, os grandes teriam de ir a peso 13 — bandeiras valendo 26
 *    aritméticas —, e na leva seguinte de doze jogos o número já estaria errado
 *    outra vez. Peso é amplificador relativo, não fatia; perseguir uma fatia com
 *    ele obriga a re-tunar o balanceamento a cada release, que é a mesma
 *    armadilha da decisão 3 por outro caminho. Normalizar o peso dentro da
 *    categoria, a outra saída óbvia, é medidamente pior: três dos quatro
 *    grandes moram em Geografia, então a normalização os espreme para 9,9% e a
 *    separação entre quem domina os grandes e quem os evita cai de 1,5 ponto
 *    para 0,0 — a nota deixa de distinguir os dois.
 *
 *    O que sobra de verdade é que quatro jogos em sessenta e nove não separam
 *    muito ninguém, e isso é aritmética, não calibragem. Quem responde por essa
 *    leitura são a etiqueta de cobertura e as notas por matéria, não a coluna
 *    de peso.
 * 3. **Só jogo jogado entra na conta.** A nota é o desempenho no que foi
 *    jogado, e jogo intocado fica fora do numerador *e* do denominador.
 *
 *    Era o contrário: jogo não jogado contava zero, o que fazia a nota medir
 *    "quanto do Nerd Trainer você domina". Parece inocente e não é — o
 *    denominador era a soma dos pesos de todos os critérios, então **lançar um
 *    jogo novo derrubava a nota de todo mundo retroativamente**. Três jogos de
 *    química a mais levavam um 62 para 48 sem ninguém jogar um dia pior, e a
 *    nota deixava de ser comparável com ela mesma entre duas versões do app.
 *
 *    O que se perde é a trava que impedia tirar 100 maxando um jogo só. Ela
 *    agora vive no mostrador, não na fórmula: a nota anda sempre acompanhada de
 *    "em N de M jogos", e um "100 · em 1 de 15 jogos" se denuncia sozinho.
 *    Misturar cobertura dentro da conta era justamente o que diluía.
 * 4. **A fração entra numa curva de retorno decrescente.** Ver `CURVA`. Num
 *    medidor que cobre seis matérias e quase setenta jogos, tratar 0→50% e
 *    50→100% como o mesmo esforço pune quem faz o que o app pede.
 * 5. **A estreia não conta, salvo se já bateu a meta.** Ver
 *    `PARTIDAS_PARA_ENTRAR`. É a contraparte necessária da decisão 3: se jogo
 *    intocado fica fora da conta, abrir um jogo pela primeira vez não pode ser
 *    o ato que derruba a nota.
 */

export const AREAS = ['memoria', 'sequencia', 'velocidade'] as const
export type Area = (typeof AREAS)[number]

export const ROTULO_AREA: Record<Area, string> = {
  memoria: 'Repertório',
  sequencia: 'Sequências',
  velocidade: 'Cálculo',
}

export const DESCRICAO_AREA: Record<Area, string> = {
  memoria: 'conteúdo decorado: elementos, fórmulas, constantes, símbolos',
  sequencia: 'dígitos e termos em ordem, sem errar nenhum',
  velocidade: 'contas e derivadas contra o relógio',
}

/**
 * Os únicos pesos que um critério pode ter, do mais alto ao mais baixo.
 *
 *   4   — o grande feito de repertório: de dezenas a centenas de itens
 *   3   — repertório duro, ou a compreensão que não se decora
 *   2   — repertório fechado e decorável, de algumas dezenas de itens
 *   1   — sequência curta ou cronometrado: treina reflexo, não acervo
 *   0,5 — somar rápido, a coisa que menos diz sobre repertório
 *
 * Existe como constante, e com `peso` tipado por ela, porque o balanceamento
 * passou a ser escrito por várias mãos ao mesmo tempo — trinta e quatro jogos
 * entraram num dia só. Com `peso: number` solto, o primeiro autor que achar que
 * o jogo dele merece "um pouco mais que 2" escreve `peso: 2.5`, e a partir daí
 * a escala não é escala: é uma opinião por arquivo, e a régua da nota passa a
 * mudar de forma sem ninguém ter decidido nada. A alternativa descartada foi
 * confiar na revisão de código — com 69 critérios e crescendo, a revisão lê o
 * comentário bonito da meta e passa por cima do número do peso.
 *
 * Note que a documentação já tinha derrapado: até esta auditoria o comentário
 * anunciava "três degraus, de 1 a 3" enquanto a tabela usava cinco valores, de
 * 0,5 a 4. Era exatamente o sintoma que esta constante existe para impedir.
 */
export const ESCALA_DE_PESO = [4, 3, 2, 1, 0.5] as const
export type Peso = (typeof ESCALA_DE_PESO)[number]

export interface Criterio {
  readonly jogoId: string
  /** Pontuação que vale nota cheia naquele jogo. */
  readonly meta: number
  readonly peso: Peso
  readonly area: Area
}

/**
 * Peso e meta fazem coisas diferentes, e confundir as duas custou caro aqui.
 *
 * **Peso não soma ponto: ele amplifica a sua fração.** A nota é
 * `Σ(fração × peso) / Σ(peso)`, então subir o peso de um jogo em que você vai
 * mal puxa a média *para baixo*, não para cima. Peso 3 num jogo onde você tem
 * 20% machuca três vezes mais. Ele responde "quanto este jogo fala sobre
 * alguém", não "quanto este jogo é difícil".
 *
 * **Quem paga a dificuldade é a meta.** E era aqui que estava o erro: países e
 * bandeiras nasceram com meta 195, o dataset inteiro. Isso contraria a regra
 * número 1 deste arquivo — π tem meta 100 e não as milhares de casas
 * embutidas, porque a meta é o que dá para decorar de verdade. Saber 150
 * países já é coisa de gente muito fora da curva; exigir os 195 para dar nota
 * cheia transformava dois dos jogos maiores em poço sem fundo.
 *
 * Os degraus da escala e o que cada um quer dizer estão em `ESCALA_DE_PESO`,
 * que é a fonte da verdade e o que o compilador cobra. Daqui para baixo ficam
 * só os comentários de caso a caso, que é onde mora a discussão de verdade.
 */
export const CRITERIOS: readonly Criterio[] = [
  // 4 — os grandes feitos de repertório. Saber isto diz muito sobre alguém.
  { jogoId: 'tabela-periodica', meta: 118, peso: 4, area: 'memoria' },
  { jogoId: 'paises', meta: 195, peso: 4, area: 'memoria' },
  { jogoId: 'bandeiras', meta: 120, peso: 4, area: 'memoria' },
  { jogoId: 'capitais', meta: 130, peso: 4, area: 'memoria' },

  // 3 — repertório duro, ou o feito que é sinônimo de nerd.
  { jogoId: 'pi', meta: 100, peso: 3, area: 'sequencia' },
  { jogoId: 'constantes-fisicas', meta: 14, peso: 3, area: 'memoria' },
  { jogoId: 'formulas', meta: 54, peso: 3, area: 'memoria' },
  // O mesmo acervo da tabela periódica por outro ângulo, e é por isso que é 3 e
  // não 4: peso máximo nos dois amplificaria duas vezes o mesmo conhecimento.
  { jogoId: 'simbolos-elementos', meta: 100, peso: 3, area: 'memoria' },
  // 40 de 49: a cauda (⊨, ⊢, ∎, ∵) é obscura de verdade, e o baralho é
  // digitado — exigir os 49 viraria o poço sem fundo que países já foi.
  { jogoId: 'simbolos-matematicos', meta: 40, peso: 3, area: 'memoria' },
  // O mesmo 130 das capitais, de propósito: 58 das 195 cartas caem em cinco
  // blocos compartilhados (euro, CFA, dólar) e saem quase de graça depois que se
  // pega o padrão. Peso 3 e não 4 porque é o quarto jogo sobre o mesmo acervo de
  // países — peso máximo amplificaria o mesmo conhecimento uma quarta vez.
  { jogoId: 'moedas', meta: 130, peso: 3, area: 'memoria' },
  // Peso 3 como as fórmulas, e pelo mesmo motivo: não é repertório decorável,
  // é compreensão. Acertar 30 de 32 aqui diz mais sobre alguém do que qualquer
  // outro jogo de matemática do app.
  { jogoId: 'linguagem-matematica', meta: 32, peso: 3, area: 'memoria' },

  // 2 — repertório fechado e decorável.
  { jogoId: 'alfabeto-grego', meta: 24, peso: 2, area: 'memoria' },
  { jogoId: 'prefixos-si', meta: 24, peso: 2, area: 'memoria' },
  // 22 de 26: o baralho tem cauda de verdade (katal, lux, gray, sievert), ao
  // contrário da nomenclatura de ácidos, onde o baralho é a própria regra.
  { jogoId: 'grandezas', meta: 22, peso: 2, area: 'memoria' },
  // Peso 2 e não 3 apesar de ser compreensão: baralho de escolha mede
  // reconhecer, que é evidência mais fraca por carta — como a geometria molecular.
  { jogoId: 'analise-dimensional', meta: 34, peso: 2, area: 'memoria' },
  { jogoId: 'geometria-molecular', meta: 32, peso: 2, area: 'memoria' },
  // 38 cartas, 30 delas de escolha: o chute puro já entrega uns 9, então a meta
  // tem de ficar bem acima do piso do acaso.
  { jogoId: 'sistema-solar', meta: 32, peso: 2, area: 'memoria' },
  // Lista fechada de 17: meta menor daria nota cheia a quem decorou os 12
  // férmions e esqueceu os bósons, que é justamente a metade que separa quem
  // entendeu o quadro de quem decorou partículas.
  { jogoId: 'modelo-padrao', meta: 17, peso: 2, area: 'memoria' },
  // 22 de escolha, chute entrega ~5,5. 18 é ter as galileanas, as de Saturno e
  // as de Urano; o resto é cauda.
  { jogoId: 'luas', meta: 18, peso: 2, area: 'memoria' },
  { jogoId: 'filosofia', meta: 45, peso: 2, area: 'memoria' },
  { jogoId: 'sociologia', meta: 32, peso: 2, area: 'memoria' },
  // Um degrau abaixo dos irmãos (filosofia 83%, sociologia 82%): a cauda aqui é
  // mais obscura — Walras, Mises, Pareto, Ostrom não caem em prova de escola.
  { jogoId: 'economia', meta: 30, peso: 2, area: 'memoria' },
  // A meta mais alta da faixa, porque é o baralho sem cauda: mitologia grega vem
  // de desenho animado e os egípcios são os de qualquer documentário.
  { jogoId: 'mitologia', meta: 28, peso: 2, area: 'memoria' },
  // A mais baixa: dez cartas do baralho são difíceis de verdade e existem para
  // dar profundidade, não para virar pedágio.
  { jogoId: 'pinturas', meta: 28, peso: 2, area: 'memoria' },
  // 26 de 32: a cauda (Methuen, Nanquim, Brest-Litovski) é conhecimento de
  // especialista, e o baralho inteiro viraria jogo de nota de rodapé.
  { jogoId: 'revolucoes', meta: 26, peso: 2, area: 'memoria' },
  // 40 de 53: o cânone inteiro menos a dúzia que só quem lê fora da escola
  // conhece (Ulisses, Mrs. Dalloway, O Ateneu).
  { jogoId: 'obras', meta: 40, peso: 2, area: 'memoria' },
  // 40 de 49, mais alta que a de obras porque é escolha de quatro: o chute cego
  // já entrega uns 12, e meta baixa mediria sorte.
  { jogoId: 'escolas-literarias', meta: 40, peso: 2, area: 'memoria' },
  // 36 de 49: a cauda escolástica (petitio principii, a fortiori, rebus sic
  // stantibus) é obscura de verdade, e o baralho inteiro seria poço sem fundo.
  { jogoId: 'latim', meta: 36, peso: 2, area: 'memoria' },
  { jogoId: 'estados', meta: 27, peso: 2, area: 'memoria' },
  { jogoId: 'capitais-estados', meta: 27, peso: 2, area: 'memoria' },
  // 40 de 51, e não o tabuleiro cheio como nas 27 UFs: estado americano é
  // repertório estrangeiro, e a cauda (as duas Dakotas, Kansas/Arkansas/
  // Nebraska, DC) é difícil de verdade — mesma lógica de capitais e bandeiras.
  { jogoId: 'eua', meta: 40, peso: 2, area: 'memoria' },
  // 33 de 39: as 12 cartas de pista saem de graça para quem sabe os seis biomas,
  // então o trabalho está nas 27 UFs — e 33 perdoa justamente as divididas.
  { jogoId: 'biomas', meta: 33, peso: 2, area: 'memoria' },
  // Morte súbita: o placar é a sequência, e 30 sorteios entre 64 praticamente
  // garantem passar por UGA, AUA e pelas três paradas.
  { jogoId: 'codigo-genetico', meta: 30, peso: 2, area: 'memoria' },
  // Meta calculada e não estimada: quem sabe as 20 siglas e chuta a inicial nas
  // letras chega a 31 de 40 sem saber um código de uma letra sequer. 35 exige
  // pelo menos quatro das nove arbitrárias.
  { jogoId: 'aminoacidos', meta: 35, peso: 2, area: 'memoria' },
  // 19 de 21: sem cauda obscura, mas de escolha, e as cartas que decidem
  // (peroxissomo, envoltório nuclear) só se acertam sabendo a vizinha.
  { jogoId: 'organelas', meta: 19, peso: 2, area: 'memoria' },
  // 17 de 20: a direção de cada carta é sorteada, então duas partidas nunca são
  // a mesma prova — e a cauda é ACTH, aldosterona e o par que vem do hipotálamo.
  { jogoId: 'hormonios', meta: 17, peso: 2, area: 'memoria' },
  // 80% do baralho, a mesma proporção das escolas literárias: com quatro opções
  // o chute cego já entrega uns 11, e as 45 cobrariam acerto na meia-dúzia que a
  // própria literatura escolar disputa (craca, chupim, formiga-e-pulgão).
  { jogoId: 'relacoes-ecologicas', meta: 36, peso: 2, area: 'memoria' },
  // 44 de 53, e a conta é sobre as armadilhas: as 9 cartas sem pegadinha saem de
  // graça, então a nota cheia exige 35 das 44 que enganam.
  { jogoId: 'taxonomia', meta: 44, peso: 2, area: 'memoria' },
  // Peso 2 como o irmão, e não 1: a sobreposição entre os dois é de sete
  // espécies em quarenta, não o mesmo acervo medido duas vezes — que foi o caso
  // de `simbolos-elementos` contra a tabela periódica, onde os 118 são os mesmos.
  { jogoId: 'nomes-cientificos', meta: 32, peso: 2, area: 'memoria' },
  // 150, e não 130: cinco palavras (inglês, francês, árabe, espanhol, português)
  // já cobrem 142 das 195 cartas, então meta baixa daria nota cheia a quem não
  // encara Suriname, Butão, Eritreia.
  { jogoId: 'idiomas', meta: 150, peso: 2, area: 'memoria' },
  // 20 de 30: a cauda (Palk, Kerch, Öresund, Davis) é de especialista.
  { jogoId: 'estreitos', meta: 20, peso: 2, area: 'memoria' },
  // 26 de 32: a lista é de escola e umas vinte saem quase de graça. A cauda é o
  // trio do quadril — ílio, ísquio e púbis, que a maioria chama de "bacia".
  { jogoId: 'esqueleto', meta: 26, peso: 2, area: 'memoria' },
  { jogoId: 'funcoes-organicas', meta: 36, peso: 2, area: 'memoria' },
  // 40 de 49: a cauda de laboratório (tiocianato, oxalato, plumboso) não é o
  // que separa quem sabe a tabela de íons de quem não sabe.
  { jogoId: 'ions', meta: 40, peso: 2, area: 'memoria' },
  // O baralho inteiro, porque o baralho É uma regra: quem entendeu hipo-/per-
  // gera os 28 sozinho, e meta menor daria nota cheia a meia série.
  { jogoId: 'nomenclatura-acidos', meta: 28, peso: 2, area: 'memoria' },
  // Morte súbita: a pontuação é a sequência sem errar, não o baralho de 118.
  { jogoId: 'familias-periodicas', meta: 40, peso: 2, area: 'memoria' },

  // 1 — sequências curtas e cronometrados: treinam reflexo, não acervo.
  { jogoId: 'e', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'phi', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'raiz-2', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'primos', meta: 40, peso: 1, area: 'sequencia' },
  { jogoId: 'fibonacci', meta: 30, peso: 1, area: 'sequencia' },
  { jogoId: 'potencias-2', meta: 40, peso: 1, area: 'sequencia' },
  // As onze fronteiras inteiras: parar no visível é parar na metade fácil.
  { jogoId: 'espectro', meta: 11, peso: 1, area: 'sequencia' },
  // 15 de 20: as dez primeiras posições qualquer um arrisca, então a nota cheia
  // tem de exigir a metade que ninguém sabe — Cazaquistão, Argélia, RDC.
  { jogoId: 'maiores-paises', meta: 15, peso: 1, area: 'sequencia' },
  // 16 obriga a atravessar a virada dos rios para as montanhas: meta ≤ 10 daria
  // nota cheia a quem nunca chegou ao segundo trecho.
  { jogoId: 'rios-montanhas', meta: 16, peso: 1, area: 'sequencia' },
  // 20 porque 18 é só a porta da segunda divisão: meta menor daria nota cheia a
  // quem nunca recitou uma fase de meiose II, que é o conteúdo do jogo.
  { jogoId: 'divisao-celular', meta: 20, peso: 1, area: 'sequencia' },
  // 16 = os quatro éons mais os doze períodos, a escala inteira no nível que o
  // jogo cobra. As duas épocas finais são zoom e ninguém que chegou lá erra.
  { jogoId: 'eras-geologicas', meta: 16, peso: 1, area: 'sequencia' },
  // 17 de 34, e a conta é uma propriedade da lista: a dificuldade está toda nos
  // treze primeiros itens, e 17 é a metade, que cai em Café Filho. Quem chega ali
  // recitou a República Velha inteira e passou pelo Vargas repetido. De JK em
  // diante é o que a escola e o noticiário já deram.
  { jogoId: 'presidentes', meta: 17, peso: 2, area: 'sequencia' },
  // Idem: a lista É a periodização, e dar nota cheia por 8 de 11 premiaria quem
  // não sabe onde entra o Reino Unido — que é o item que o jogo existe para ensinar.
  { jogoId: 'periodos-brasil', meta: 11, peso: 1, area: 'sequencia' },
  { jogoId: 'derivadas-rapidas', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'ordem-de-grandeza', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'nox', meta: 25, peso: 1, area: 'velocidade' },
  // Meta 20 e não os 25 dos irmãos: lá o item é "+6" contra "−2", aqui cada
  // carta pede a leitura de quatro cadeias de orbitais. Com 25 a barra sairia
  // calada porém mais alta que a dos vizinhos de mesmo peso.
  { jogoId: 'configuracao-eletronica', meta: 20, peso: 1, area: 'velocidade' },
  // Mesma conta do anterior: ler a equação e comparar quatro conjuntos de
  // quatro números custa mais que ler "nox do S em H₂SO₄", e o relógio maior
  // paga o custo do item, não aumenta a vazão.
  { jogoId: 'balanceamento', meta: 20, peso: 1, area: 'velocidade' },
  { jogoId: 'ph', meta: 25, peso: 1, area: 'velocidade' },
  // 20: cada item é uma linha de dados a decifrar e uma variável a isolar antes
  // de qualquer conta — não se lê na batida de "nox do S em H₂SO₄".
  { jogoId: 'cinematica', meta: 20, peso: 1, area: 'velocidade' },
  // 25: dois dados e uma seta, mesma batida e mesmo bônus dos irmãos.
  { jogoId: 'circuitos', meta: 25, peso: 1, area: 'velocidade' },
  // 20 pela mesma conta do balanceamento: quatro fitas de seis caracteres não
  // se leem na batida de "nox do S em H₂SO₄".
  { jogoId: 'transcricao', meta: 20, peso: 1, area: 'velocidade' },
  // 20 pelo mesmo motivo: no nível 2 o item é uma frase com dois genitores e um
  // recorte da prole, que não se lê na batida de "nox do S em H₂SO₄".
  { jogoId: 'genetica', meta: 20, peso: 1, area: 'velocidade' },
  { jogoId: 'massa-molar', meta: 25, peso: 1, area: 'velocidade' },
  { jogoId: 'cronologia', meta: 30, peso: 1, area: 'velocidade' },

  // 0,5 — somar rápido é a coisa que menos diz sobre repertório. Peso
  // fracionário existe para isto: não havia degrau abaixo de 1 e "cálculo
  // rápido valendo o mesmo que decorar as constantes" era desproporcional.
  { jogoId: 'aritmetica', meta: 40, peso: 0.5, area: 'velocidade' },
]

export interface LinhaNerdometro {
  readonly jogoId: string
  readonly nome: string
  readonly icone: string
  readonly area: Area
  /**
   * A matéria do jogo, vinda de `JOGOS` — é a mesma divisão do menu, e é
   * ortogonal à área: "Repertório" corta geografia e química ao mesmo tempo.
   * `null` só se o critério apontar para um jogo inexistente.
   */
  readonly categoria: Categoria | null
  readonly recorde: number
  readonly meta: number
  /**
   * O placar que conta na nota: o melhor das `PARTIDAS_NA_JANELA` últimas
   * partidas. Não é o `recorde`, que é histórico e nunca desce.
   */
  readonly vigente: number
  /** 0 a 1, do `vigente` contra a meta. Ainda **sem** a ferrugem. */
  readonly fracao: number
  /** 0,7 a 1 — ver `ferrugemEm`. O que multiplica a fração na nota. */
  readonly ferrugem: number
  /** Dias desde a última partida. 0 em jogo nunca jogado. */
  readonly diasParado: number
  readonly peso: number
  /** Quanto a nota final sobe se este jogo for ao máximo. */
  readonly potencial: number
  readonly partidas: number
  /** Bateu a meta sem errar nada, dentro da janela — ver `BONUS_DE_LIMPEZA`. */
  readonly limpa: boolean
  /** Chegou na meta. */
  readonly dominado: boolean
  /** Passou dela: a fração está acima de 1 e o jogo rende mais que o cheio. */
  readonly superado: boolean
  /**
   * Já pesa na nota. `false` também em jogo jogado uma vez só e ainda longe da
   * meta — ver `PARTIDAS_PARA_ENTRAR`. A tela precisa disto para não deixar o
   * jogador procurando por que a nota não mexeu.
   */
  readonly naNota: boolean
}

export interface NotaArea {
  readonly area: Area
  /** 0 a 100 dentro da própria área. */
  readonly nota: number
  readonly dominados: number
  readonly jogos: number
}

export interface NotaCategoria {
  readonly categoria: Categoria
  /**
   * 0 a 100 dentro da própria matéria, pela mesma regra da nota geral.
   *
   * `null` — e não 0 — quando nenhum jogo da matéria foi jogado: zero é um
   * desempenho ruim, "não jogou" é ausência de desempenho, e o mostrador
   * precisa dizer coisas diferentes para cada um.
   */
  readonly nota: number | null
  readonly jogados: number
  readonly dominados: number
  readonly jogos: number
}

/**
 * O ranking: cinco patentes, vinte e um elos.
 *
 * Substituiu nove títulos soltos — "Nerd de carteirinha", "Enciclopédia
 * ambulante", "Perigo em jantar de família" —, e o que a troca conserta é real:
 * nove piadas em fila não formam escada. Cada título era uma leitura isolada da
 * nota, então ele não dizia *onde* a pessoa está: dava para ver "Perigo em
 * jantar de família" sem saber se aquilo era metade do caminho ou o fim dele. Um
 * ranking de patente + grau dá duas leituras ao mesmo número — a patente diz
 * quem você é, o grau diz quanto falta para a próxima — e é o que permite à tela
 * mostrar a escada inteira, com a sua posição dentro dela.
 *
 * As três decisões:
 *
 * 1. **O elo é função da nota, e desce junto com ela.** Não há marca d'água:
 *    quem cai de 63 para 62 volta de `Virgem I` para `Nerd V`. Travar no maior
 *    elo já atingido foi considerado e descartado por duas razões — exigiria
 *    guardar mais um estado no banco, e faria a patente mentir sobre o presente,
 *    que é justamente o que ela existe para resumir. A regressão, aliás, é rara
 *    de propósito: recorde nunca cai, e o único jeito de a nota baixar é um jogo
 *    novo entrar fraco no denominador, coisa de que a carência de estreia já
 *    cuida (ver `PARTIDAS_PARA_ENTRAR`).
 * 2. **Apertado embaixo, caro em cima.** Os elos de `Curioso` custam 3 pontos de
 *    nota cada; os de `Virgem`, 6 e 7. Não é decoração, e o efeito é maior do
 *    que a largura em pontos deixa ver: a nota já passa pela curva de retorno
 *    decrescente (ver `CURVA`), então medido em fração das metas — o
 *    conhecimento de verdade — o primeiro elo custa meio ponto percentual e o
 *    último custa dez, vinte vezes mais. Quem abre o app sobe alguns elos na
 *    primeira sessão; quem está em `Virgem V` está a 82% das metas do que jogou.
 * 3. **Os mínimos são da nota, não da fração.** Um elo nunca se compara com
 *    "quantos % do baralho eu sei": ele se compara com a nota, que já pondera
 *    peso e passa pela curva. Em fração média das metas jogadas, os vinte e um
 *    caem em 0 · 0,5 · 1 · 3 · 4 · 6 · 8 · 11 · 14 · 17 · 22 · 26 · 31 · 37 ·
 *    42 · 49 · 57 · 64 · 74 · 82 · 92 por cento — nenhum par de vizinhos empata,
 *    ou seja, a escada discrimina do começo ao fim mesmo com vinte e um degraus.
 *
 * Vinte e um, e não os treze da sugestão original, é decisão do dono do app:
 * mais elos, mais vezes que a tela tem uma conquista para anunciar. O teto
 * prático é a resolução da própria nota — ela é inteira, e elo de 2 pontos
 * subiria sozinho no arredondamento de qualquer partida mediana.
 */
export interface Patente {
  readonly nome: string
  /** Nome curto, para a trilha na tela. */
  readonly curto: string
  /** Os graus, de baixo para cima. Um só quando a patente não tem graus. */
  readonly graus: readonly { readonly minimo: number; readonly lema: string }[]
}

export const PATENTES: readonly Patente[] = [
  {
    nome: 'Curioso',
    curto: 'Curioso',
    graus: [
      { minimo: 0, lema: 'zero. abriu isso aqui pra quê?' },
      { minimo: 3, lema: 'entrou, se assustou e ficou olhando' },
      { minimo: 6, lema: 'jogou duas partidas e já se acha' },
      { minimo: 9, lema: 'tá começando a gostar, e isso é preocupante' },
      { minimo: 12, lema: 'fraco. nem nerd direito você é ainda' },
    ],
  },
  {
    nome: 'CDF',
    curto: 'CDF',
    graus: [
      { minimo: 16, lema: 'ainda dá pra fingir que é normal, aproveita' },
      { minimo: 20, lema: 'sentava na primeira fileira e todo mundo lembra' },
      { minimo: 24, lema: 'faz resumo colorido e empresta pros outros' },
      { minimo: 28, lema: 'lembra o professor do dever de casa' },
      { minimo: 32, lema: 'já corrige o professor, mas baixinho' },
    ],
  },
  {
    nome: 'Nerd',
    curto: 'Nerd',
    graus: [
      { minimo: 37, lema: 'assumiu de vez, agora não tem volta' },
      { minimo: 42, lema: 'leu a Wikipédia inteira de um assunto só' },
      { minimo: 47, lema: 'seus amigos já mudam de assunto quando você começa a falar' },
      { minimo: 52, lema: 'carteirinha plastificada e cordão no pescoço' },
      { minimo: 57, lema: 'discute nomenclatura em mesa de bar' },
    ],
  },
  {
    nome: 'Virgem',
    curto: 'Virgem',
    graus: [
      { minimo: 63, lema: 'seu último date foi explicando a tabela periódica' },
      { minimo: 69, lema: 'no churrasco ninguém mais senta do seu lado' },
      { minimo: 75, lema: 'sua mãe já parou de perguntar se você conheceu alguém' },
      { minimo: 82, lema: 'sua família já desistiu de te apresentar pra alguém' },
      { minimo: 88, lema: 'você corrigiu alguém no velório' },
    ],
  },
  {
    nome: 'Ultra Virgem',
    curto: 'Ultra',
    graus: [{ minimo: 95, lema: 'cara, vai arrumar uma namorada' }],
  },
]

const ROMANOS = ['I', 'II', 'III', 'IV', 'V'] as const

export interface Faixa {
  readonly minimo: number
  readonly patente: string
  /** O nome curto da patente, para onde não cabe o longo. */
  readonly curto: string
  /** 1 a 5, ou `null` na patente de elo único. */
  readonly grau: number | null
  /**
   * O grau em romano, `null` junto com ele.
   *
   * Vem daqui e não da tela porque a tabela de romanos é uma só: com uma cópia
   * no componente, esticar o ranking de três para cinco graus deixaria a tela
   * escrevendo `undefined` no quarto elo de cada patente.
   */
  readonly romano: string | null
  /** Patente e grau juntos: `Nerd II`. É o nome que a tela diz. */
  readonly titulo: string
  readonly lema: string
  /** A posição na escada, de 0 ao topo. */
  readonly indice: number
}

/**
 * Os vinte e um elos em ordem de subida — e em ordem de subida de propósito: a
 * tela desenha a escada nesta ordem, e uma lista invertida obrigaria todo leitor
 * (e todo teste) a lembrar disso. Quem precisa achar o degrau de uma nota usa
 * `degrauDe`.
 *
 * Derivada de `PATENTES`, e não escrita à mão, porque o título é a única coisa
 * aqui que dá para escrever errado sem quebrar nada: um `Nerd IIII` ou um grau
 * repetido passaria pela revisão e só apareceria na tela de alguém.
 */
export const FAIXAS: readonly Faixa[] = PATENTES.flatMap((p) =>
  p.graus.map((g, i): Faixa => {
    const grau = p.graus.length > 1 ? i + 1 : null
    const romano = grau === null ? null : (ROMANOS[i] as string)
    return {
      minimo: g.minimo,
      patente: p.nome,
      curto: p.curto,
      grau,
      romano,
      titulo: romano === null ? p.nome : `${p.nome} ${romano}`,
      lema: g.lema,
      indice: 0,
    }
  }),
).map((f, indice) => ({ ...f, indice }))

/**
 * De onde para cima o certificado existe.
 *
 * `Nerd V` e não `Curioso I` porque um diploma que todo mundo tem no primeiro
 * dia não é diploma — o valor dele é ser a prova de uma coisa difícil. É o
 * décimo quinto dos vinte e um elos, e pede nota 57: em fração das metas
 * jogadas, 42% do que você abriu, o que no catálogo inteiro é bastante coisa.
 *
 * Fica aqui, e é procurado pelo título, porque a régua do certificado é a mesma
 * régua do ranking. Com o número 57 copiado no componente, reequilibrar a tabela
 * de `PATENTES` mudaria o elo e não mudaria o diploma, e ninguém perceberia.
 */
export const ELO_DO_CERTIFICADO = 'Nerd V'

/**
 * Onde `ELO_DO_CERTIFICADO` cai na escada.
 *
 * Explode se o título não existir, e é de propósito: um certificado que nunca
 * libera, porque alguém renomeou `Nerd V`, é um defeito que não dá sintoma
 * nenhum — a tela simplesmente nunca mostraria o botão, para sempre.
 */
function indiceDoCertificado(): number {
  const elo = FAIXAS.find((f) => f.titulo === ELO_DO_CERTIFICADO)
  if (!elo) throw new Error(`ELO_DO_CERTIFICADO "${ELO_DO_CERTIFICADO}" não existe em FAIXAS`)
  return elo.indice
}

/** O índice em `FAIXAS` do degrau em que a nota cai. Nunca falha: 0 é o piso. */
export function degrauDe(nota: number): number {
  let i = 0
  while (i + 1 < FAIXAS.length && nota >= (FAIXAS[i + 1] as Faixa).minimo) i++
  return i
}

/** Um jogo, e a pontuação a fazer nele. Ver `montarComoSubir`. */
export interface PassoParaSubir {
  readonly jogoId: string
  readonly nome: string
  readonly icone: string
  /** A pontuação a alcançar naquele jogo. */
  readonly alvo: number
  /** `alvo - recorde`: o que falta conquistar. */
  readonly faltam: number
  readonly partidas: number
}

export interface Nerdometro {
  /** 0 a 100. */
  readonly nota: number
  readonly faixa: Faixa
  /** A próxima faixa, e quantos pontos faltam. `null` no topo. */
  readonly proximaFaixa: { readonly faixa: Faixa; readonly falta: number } | null
  /**
   * 0 a 100 **dentro do degrau atual** — o arco do medidor passou a mostrar
   * isto, e não a nota crua.
   *
   * O motivo é que a nota crua desenhava um arco que quase não se mexia: subir
   * de `Nerd II` para `Nerd III` são 8 pontos em 100, ou seja, 8% de arco por
   * degrau conquistado. Em progresso de degrau, a mesma conquista preenche a
   * volta inteira. 100 no topo, onde não há próximo degrau a preencher.
   */
  readonly progressoNoDegrau: number
  /**
   * O que fazer para subir de faixa, em até 3 jogos. Vazio no topo.
   *
   * Com `subirPedeMaisDeUmJogo` em `false`, cada linha alcança a faixa
   * **sozinha** e a tela oferece as três como alternativas. Com ele em `true`,
   * as linhas são um plano: ou os alvos **somados** alcançam a faixa, ou nem
   * levando os três ao máximo dá e o que está ali é o que mais aproxima.
   */
  readonly comoSubir: readonly PassoParaSubir[]
  /**
   * Nenhum jogo sozinho alcança a próxima faixa, e a tela precisa dizer que o
   * caminho passa por mais de um. O caso comum desde que o catálogo passou de
   * sessenta critérios: a fatia de um jogo no denominador encolheu.
   */
  readonly subirPedeMaisDeUmJogo: boolean
  readonly linhas: readonly LinhaNerdometro[]
  readonly areas: readonly NotaArea[]
  /** A mesma nota, recortada pelas matérias do menu. */
  readonly categorias: readonly NotaCategoria[]
  /** Onde há mais nota a ganhar. */
  readonly proximoPasso: LinhaNerdometro | null
  readonly jogados: number
  /**
   * Jogados uma vez só e ainda fora da nota. O mostrador fala deles: sem isso,
   * a carência vira um número que não mexe e ninguém sabe por quê.
   *
   * A lista, e não só a contagem, porque "8 em experiência" mandava o jogador
   * adivinhar quais oito eram — e a resposta ("jogue de novo") não serve para
   * nada sem os nomes. A tela mostra a contagem e abre a lista.
   */
  readonly emExperiencia: readonly LinhaNerdometro[]
  /**
   * Os jogos que já estão enferrujando, do que mais custa nota para o que menos.
   *
   * A lista, e não só a contagem, pela mesma razão de `emExperiencia`: uma nota
   * que cai sozinha e um mostrador que não diz de onde é bug, do ponto de vista
   * de quem olha. Aqui a resposta é a própria lista de tarefas — estes são os
   * jogos a revisitar, e nesta ordem.
   */
  readonly enferrujados: readonly LinhaNerdometro[]
  /** Quantos pontos de nota a ferrugem está tirando agora. */
  readonly custoDaFerrugem: number
  /** Chegou em `ELO_DO_CERTIFICADO` — ver lá por que o diploma começa tão em cima. */
  readonly podeCertificar: boolean
  /** Dias seguidos jogando — ver `ofensiva`. */
  readonly ofensiva: Ofensiva
  readonly total: number
  readonly dominados: number
  readonly partidas: number
  /** Tempo somado de todas as partidas registradas, em ms. */
  readonly tempoMs: number
}

/**
 * Média ponderada sobre os jogos jogados, opcionalmente fingindo que um deles
 * está no máximo — é assim que sai o `potencial` de cada linha.
 *
 * Um jogo intocado que vai ao máximo entra também no denominador. Ainda assim
 * nunca derruba a nota: com `fracao ≤ 1` vale sempre `soma ≤ peso`, e daí
 * `(soma+p)/(peso+p) ≥ soma/peso`. No máximo empata, quando tudo que foi
 * jogado já está no teto.
 */
/**
 * A curva de retorno decrescente.
 *
 * A fração crua é linear, e linear está errado aqui: ir de 0 a 40 países leva
 * uma tarde, de 140 a 150 leva semanas. A escala linear diz que o primeiro
 * trecho vale 40 e o segundo vale 10, quando o esforço é o contrário. Num
 * medidor que cobre seis matérias, isso pune exatamente quem faz o que o app
 * pede — saber de tudo um pouco — e premia quem mói um jogo só.
 *
 * `0.65` foi escolhido contra dados reais de uma sessão de um dia: 66% da
 * tabela periódica passa a valer 76, e 29% dos países passa a valer 44. Os dois
 * extremos continuam honestos — 100% continua 100%, e uma partida abandonada no
 * primeiro card (1 de 120) sobe de 1% para 4%, ou seja, a curva não resgata
 * lixo.
 *
 * Reconferido com 69 critérios: o expoente age dentro de cada jogo, antes da
 * ponderação, então o tamanho do catálogo não o afeta — o que muda com o
 * catálogo é o denominador, e disso cuida a decisão 3. O que a curva faz com o
 * ranking continua o prometido: `Ultra Virgem` (95) pede 92% de média das metas
 * jogadas, `Virgem V` (88) pede 82%, `Virgem I` (63) pede 49% e `Nerd I` (37)
 * pede 22%. É a curva que faz os elos de cima custarem caro sem que a tabela de
 * `PATENTES` precise abrir os degraus: lá em cima cada 6 pontos de nota são 8 de
 * fração; embaixo, cada 3 pontos são meio ponto de fração.
 */
export const CURVA = 0.65

const comCurva = (fracao: number) => fracao ** CURVA


/**
 * A estreia não conta — a menos que ela já tenha batido a meta.
 *
 * O problema que isto resolve: **experimentar um jogo derrubava a nota**. Abrir
 * a notação científica, fazer 3 de 25 na primeira partida e ver a nota geral
 * cair um ponto e a da área cair quinze não é medição, é punição por
 * curiosidade. E o catálogo só cresce: com 69 jogos, a maior parte do tempo a
 * nota seria o retrato de jogos recém-abertos, não do que a pessoa sabe. Uma
 * partida é amostra, não desempenho.
 *
 * Medido no banco real do dono do app, e é por isso que a carência ficou: abrir
 * doze jogos novos e fazer 12% da meta em cada um deixa a nota em 86, exatamente
 * onde estava. Sem a carência, a mesma tarde de curiosidade levaria a nota a 59
 * — vinte e sete pontos de castigo por ter experimentado o catálogo novo.
 *
 * A exceção existe porque a regra crua produzia um absurdo pior que o problema:
 * fechar os 24 do alfabeto grego de primeira não contava ponto nenhum. Quem
 * chegou à meta já provou o que tinha para provar, e uma segunda partida não
 * acrescentaria informação — só burocracia.
 *
 * Não é anti-trapaça: quem quiser pode jogar duas vezes mal de propósito. É
 * proteção contra o castigo de abrir um jogo pela primeira vez, e o mostrador
 * diz quantos estão nessa situação, para o número nunca parecer mágica.
 */
export const PARTIDAS_PARA_ENTRAR = 2

/**
 * A nota deixou de ser catraca: o que conta é o que você faz agora, e o que
 * você não joga enferruja.
 *
 * O defeito que isto conserta é de nascença e o ranking o deixou gritante: a
 * nota era `recorde / meta`, e recorde não desce. Quem fez 118 na tabela
 * periódica numa tarde de 2025 continuava valendo 118 para sempre, tivesse
 * esquecido tudo ou não. Uma escada de vinte e um elos onde ninguém nunca desce
 * um degrau não é ranking, é um registro de visitas.
 *
 * São duas peças, e elas cobrem buracos diferentes:
 *
 * 1. **A janela** (`PARTIDAS_NA_JANELA`). A fração vem do melhor das cinco
 *    últimas partidas daquele jogo, não do recorde histórico. É o que faz jogar
 *    mal custar: cinco sessões fracas apagam um recorde antigo. Cinco, e não
 *    três, porque três transformam uma noite ruim em queda de elo — e a nota
 *    mediria humor, não repertório.
 *
 *    O recorde histórico continua existindo e continua na tela de recordes: ele
 *    é a sua marca, e apagá-la seria mentir sobre o que você já fez. Ele só
 *    parou de ser a régua da nota.
 * 2. **A ferrugem** (`ferrugemEm`). O que você não joga perde valor com o tempo,
 *    até um piso. É o que faz sumir custar.
 *
 * As duas juntas fecham o buraco que cada uma deixa sozinha: só com a janela,
 * quem para de jogar congela a nota no último placar bom; só com a ferrugem,
 * abrir cada jogo uma vez por semana e fechar segura o ranking inteiro sem
 * acertar nada — a janela impede isso porque cinco visitas dessas viram as cinco
 * últimas partidas, e o placar vigente desaba junto.
 */

/** Quantas partidas recentes formam o placar vigente. */
export const PARTIDAS_NA_JANELA = 5

/**
 * O teto de cada jogo deixou de ser a meta — e é isto que faz a nota passar de
 * 100.
 *
 * A escala travada em 100 tinha o defeito de todo teto: quem chega nele para de
 * ter o que fazer. Pior, ela igualava coisas diferentes — quem faz exatamente a
 * meta de π (100 casas) e quem recita 400 casas tinham o mesmo 100%, e o app
 * dizia aos dois que estavam no máximo. Agora a meta é onde o jogo **começa** a
 * valer cheio, não onde ele acaba, e há 30% de sobra para quem vai além.
 *
 * O excedente tem duas portas, e existem duas porque uma sozinha seria injusta:
 *
 * - **Superar a meta.** Vale onde o baralho é maior que ela: π pede 100 casas de
 *   dez mil, idiomas pede 150 de 195, aritmética é cronometrada e não tem fim.
 * - **Partida limpa** (`BONUS_DE_LIMPEZA`). Vale em todo lugar, e é a porta de
 *   quem joga os fechados: na tabela periódica a meta *é* o baralho inteiro
 *   (118 de 118), então sem isto o jogo mais pesado do catálogo seria
 *   justamente o que não teria para onde crescer. Bater a meta sem errar uma
 *   carta é um feito diferente de bater a meta, e agora paga diferente.
 *
 * O teto de 1,3 existe para π não virar o app inteiro: sem ele, dez mil casas
 * dariam fração 100 num jogo só, e a nota deixaria de ser sobre repertório
 * amplo para ser sobre quem moeu o maior dataset. Com ele, a nota máxima é
 * `NOTA_MAXIMA` — perto de 119, não infinito. "Sem teto" aqui quer dizer que o
 * número não para em 100, não que ele não para nunca.
 */
export const TETO_DO_JOGO = 1.3

/** O que vale bater a meta sem errar nenhuma carta. */
export const BONUS_DE_LIMPEZA = 0.15

/**
 * A nota de quem levasse **todos** os jogos jogados ao teto: `100 × 1,3^γ`, ou
 * seja, perto de 119.
 *
 * Calculada e não digitada, porque ela aparece na tela — é o que o arco do topo
 * preenche — e mexer no teto ou na curva sem mexer aqui poria o medidor a
 * prometer uma nota que a fórmula não alcança.
 */
export const NOTA_MAXIMA = Math.round(100 * comCurva(TETO_DO_JOGO))

/** Dias sem jogar até a ferrugem começar. */
export const DIAS_DE_GRACA = 7

/** Dias sem jogar até a ferrugem chegar ao piso. */
export const DIAS_ATE_O_PISO = 90

/** Quanto sobra da fração de um jogo largado para sempre. */
export const PISO_DA_FERRUGEM = 0.7

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Quanto vale hoje o que você fez há `dias`: 1 na primeira semana, descendo em
 * linha reta até `PISO_DA_FERRUGEM` aos três meses.
 *
 * Os números vêm de uma conta sobre o tamanho do catálogo, não de gosto. Com
 * setenta e dois jogos, ninguém revisita tudo: quem joga dez jogos por semana
 * passa em cada um a cada sete semanas, e é esse jogador — o assíduo — que
 * define onde a nota mora em regime. Com esta curva ele fica perto de 85, e o
 * topo do ranking passa a exigir varrer o catálogo com frequência, não tê-lo
 * varrido um dia. Uma semana sumido custa cerca de 1,5 ponto de nota; três meses
 * sumido, vinte.
 *
 * O piso existe para a nota não virar zero por abandono: quem sumiu um ano ainda
 * sabe a tabela periódica, e uma escala que o manda para `Curioso I` estaria
 * medindo presença, não repertório. Setenta por cento é o quanto se assume que
 * sobrevive sem revisão nenhuma.
 *
 * A graça de uma semana é a parte que o dono do app escolheu e é a que dá o
 * ritmo: ela faz o número responder à semana, que é a unidade em que as pessoas
 * pensam o próprio hábito. Sessenta dias de graça — a proposta original — deixava
 * a nota parada tempo demais para alguém associar a queda ao sumiço.
 */
export function ferrugemEm(dias: number): number {
  if (dias <= DIAS_DE_GRACA) return 1
  const andado = (dias - DIAS_DE_GRACA) / (DIAS_ATE_O_PISO - DIAS_DE_GRACA)
  return Math.max(PISO_DA_FERRUGEM, 1 - (1 - PISO_DA_FERRUGEM) * andado)
}

function entraNaNota(l: { vigente: number; partidas: number; fracao: number }): boolean {
  if (l.vigente <= 0) return false
  return l.partidas >= PARTIDAS_PARA_ENTRAR || l.fracao >= 1
}

function media(
  linhas: readonly LinhaNerdometro[],
  noMaximo?: string,
  filtro?: (l: LinhaNerdometro) => boolean,
): number {
  let soma = 0
  let peso = 0

  for (const l of linhas) {
    if (filtro && !filtro(l)) continue
    // O jogo fingido no máximo entra sempre: chegar lá custa uma partida, e com
    // a meta cheia ele passaria pela carência de qualquer jeito.
    const cheio = l.jogoId === noMaximo
    if (!cheio && !entraNaNota(l)) continue
    // O fingido no máximo também zera a ferrugem: a partida que o leva à meta é
    // de hoje, e cobrar dele o tempo parado seria simular um jogo que ninguém
    // jogou.
    //
    // "No máximo" é **a meta**, não `TETO_DO_JOGO`: é o que as recomendações
    // pedem, e prometer o rendimento do teto num conselho que manda só bater a
    // meta seria mentira. O `max` com o valor atual existe para quem já passou
    // da meta — sem ele, simular a meta num jogo que está em 115% *baixaria* a
    // nota e o potencial daquele jogo sairia negativo.
    const efetivo = l.fracao * l.ferrugem
    soma += comCurva(cheio ? Math.max(1, efetivo) : efetivo) * l.peso
    peso += l.peso
  }

  return peso === 0 ? 0 : (soma * 100) / peso
}

/**
 * A mesma média, fingindo uma pontuação diferente num jogo — a base de toda a
 * recomendação de "como subir".
 *
 * Repare que um jogo intocado que recebe pontuação entra também no denominador:
 * é por isso que não dá para inverter a fórmula tratando o peso total como
 * constante, e é por isso que ele pode até *baixar* a nota se a pontuação for
 * fraca. A busca lida com os dois casos sem precisar saber qual é qual.
 */
function mediaCom(
  linhas: readonly LinhaNerdometro[],
  jogoId: string,
  pontuacao: number,
): number {
  let soma = 0
  let peso = 0

  for (const l of linhas) {
    // Quem está sendo simulado entra sempre: a pontuação pedida é sempre maior
    // que o recorde, então ela custa uma partida nova e cumpre a carência.
    if (l.jogoId !== jogoId && !entraNaNota(l)) continue
    const simulado = l.jogoId === jogoId
    const p = simulado ? pontuacao : l.vigente
    if (p <= 0) continue
    // Mesma regra do `noMaximo` de `media`: a pontuação pedida é sempre maior
    // que o placar vigente, então ela vem de uma partida de hoje — que entra na
    // janela das últimas cinco e zera a ferrugem daquele jogo.
    soma += comCurva(Math.min(1, p / l.meta) * (simulado ? 1 : l.ferrugem)) * l.peso
    peso += l.peso
  }

  return peso === 0 ? 0 : (soma * 100) / peso
}

/** No máximo 3: uma lista de tarefas mais longa que isso não é recomendação. */
const MAX_COMO_SUBIR = 3

/**
 * A menor pontuação neste jogo que, sozinha, faz a nota geral alcançar
 * `minimo`. `null` se nem a meta cheia chega lá.
 *
 * Busca binária em vez de inversão algébrica: a nota exibida é
 * `Math.round(base)`, o denominador muda quando um jogo intocado entra, e a
 * curva tem expoente fracionário — inverter isso na mão dá três casos e um erro
 * de arredondamento. O domínio é de 1 até a meta (no máximo 195 valores), e a
 * nota é monótona não-decrescente em `pontuacao` dentro dele (o jogo já está no
 * denominador a partir de 1 ponto), então a busca é exata.
 */
function alvoParaFaixa(
  linhas: readonly LinhaNerdometro[],
  linha: LinhaNerdometro,
  minimo: number,
): number | null {
  let baixo = Math.max(1, linha.vigente + 1)
  let alto = linha.meta

  if (baixo > alto) return null
  if (Math.round(mediaCom(linhas, linha.jogoId, alto)) < minimo) return null

  while (baixo < alto) {
    const meio = Math.floor((baixo + alto) / 2)
    if (Math.round(mediaCom(linhas, linha.jogoId, meio)) >= minimo) alto = meio
    else baixo = meio + 1
  }

  return baixo
}

/**
 * A ordem da recomendação — e esta é uma decisão de produto, não de matemática.
 *
 * O ranking óbvio seria "quem rende mais nota", que é o `potencial`. Ele está
 * errado aqui: o jogo que mais rende é quase sempre um de peso 4 e meta grande
 * que a pessoa nunca abriu, e mandar alguém decorar 130 capitais do zero não é
 * conselho, é desistência disfarçada. A recomendação só vale se for **feita**.
 *
 * Então o critério é probabilidade de execução, feita de dois sinais:
 *
 * - **familiaridade** — `partidas` daquele jogo, o único sinal honesto de "eu
 *   gosto deste". Entra em `log2`, porque a diferença entre 2 e 8 partidas diz
 *   muito e entre 40 e 60 não diz nada; sem a compressão, o jogo viciado
 *   esmagaria todo o resto da lista.
 * - **salto** — quanto falta do placar vigente até o alvo, medido em frações da
 *   meta do próprio jogo. Em pontos crus não dá para comparar: 10 pontos em π (meta
 *   100) e 10 em derivadas (meta 25) são esforços diferentes.
 *
 * `(familiaridade + 0.3) / (0.25 + salto)`. O `+0.3` mantém um jogo nunca
 * jogado na disputa — ele fica atrás de qualquer jogo conhecido, mas a ordem
 * *entre* os desconhecidos passa a ser pelo menor salto, em vez de um empate em
 * zero resolvido pela ordem de `CRITERIOS`. O `0.25` no denominador impede que
 * um salto minúsculo ("faltam 2 pontos") vire uma divisão por quase zero e
 * domine sozinho a lista.
 */
function prioridade(linha: LinhaNerdometro, alvo: number): number {
  const familiaridade = Math.log2(1 + linha.partidas)
  // Contra o placar vigente, e não contra o recorde histórico: o esforço que a
  // recomendação cobra é o de hoje. Quem fez 118 há um ano e anda fazendo 70
  // tem um salto de 48, não de zero.
  const salto = (alvo - linha.vigente) / linha.meta
  return (familiaridade + 0.3) / (0.25 + salto)
}

function passo(linha: LinhaNerdometro, alvo: number): PassoParaSubir {
  return {
    jogoId: linha.jogoId,
    nome: linha.nome,
    icone: linha.icone,
    alvo,
    faltam: alvo - linha.vigente,
    partidas: linha.partidas,
  }
}

/**
 * As mesmas linhas, com alguns jogos fingidos numa pontuação — a base do plano
 * de mais de um jogo.
 *
 * A carência é dispensada nos fingidos pela mesma razão que `mediaCom` já a
 * dispensa: o alvo é sempre maior que o placar vigente, então alcançá-lo custa
 * uma partida, e é ela que matricula o jogo. Fingir sem mexer em `partidas`
 * produziria um plano que o próprio medidor não confirmaria depois — o jogo
 * subiria de pontuação e continuaria fora da conta.
 *
 * Pela mesma razão o fingido volta sem ferrugem: a partida que cumpre o alvo é
 * de hoje.
 */
function comoSe(
  linhas: readonly LinhaNerdometro[],
  alvos: ReadonlyMap<string, number>,
): readonly LinhaNerdometro[] {
  if (alvos.size === 0) return linhas
  return linhas.map((l) => {
    const alvo = alvos.get(l.jogoId)
    if (alvo === undefined) return l
    return {
      ...l,
      vigente: alvo,
      recorde: Math.max(l.recorde, alvo),
      fracao: Math.min(1, alvo / l.meta),
      ferrugem: 1,
      diasParado: 0,
      partidas: Math.max(l.partidas, PARTIDAS_PARA_ENTRAR),
      // A simulação nunca promete o bônus de limpeza: o alvo que a tela mostra é
      // uma pontuação, e prometer nota com base em "e sem errar nada" seria
      // cobrar um preço que a linha não diz.
      limpa: false,
      dominado: alvo >= l.meta,
      superado: alvo > l.meta,
      naNota: true,
    }
  })
}

/**
 * O plano de mais de um jogo: até `MAX_COMO_SUBIR` jogos com a pontuação que,
 * **somada**, alcança a faixa. `null` se nem levando os três ao máximo dá.
 *
 * Isto existe porque o catálogo cresceu e quebrou a recomendação sem quebrar
 * nenhum teste. Medido: em perfis sintéticos com mais de vinte jogos jogados,
 * entre 74% e 96% caem no caso "nenhum jogo sozinho chega lá" — a alavanca de
 * um jogo só encolheu junto com a fatia dele no denominador. O caminho antigo
 * respondia a isso listando os três de maior `potencial` com o alvo na meta
 * cheia, que é o conselho que o comentário de `prioridade` logo acima chama de
 * desistência disfarçada: o dono do app via "chegue a 195 em países (faltam
 * 54)". Agora, quando um punhado de jogos fecha a conta, ele vira um plano de
 * verdade, com alvos proporcionais e alcançáveis.
 *
 * São dois passos:
 *
 * 1. **Quem entra no plano.** Aqui — e só aqui — `prioridade` sozinha não
 *    serve. Quando um jogo fecha a conta inteira, o quanto ele rende é
 *    irrelevante e só importa se será feito; num plano de três vagas, gastar
 *    uma vaga num jogo de peso 0,5 muito jogado torra a vaga. Por isso a escolha
 *    é `ganho × prioridade`: render nota **e** ser jogável. A ordem é gulosa e
 *    resimula a cada escolha, porque o ganho de um jogo depende de quem já está
 *    no plano (todos entram no denominador).
 * 2. **Quanto pedir de cada um.** Não a meta cheia: busca binária no *esforço
 *    comum*, a mesma fatia do que falta em cada jogo do plano. "Suba um pouco em
 *    cada um destes três" é um pedido que alguém faz; "zere os três" não é. A
 *    alternativa descartada foi maxar os dois primeiros e minimizar só o
 *    último, que dá o mesmo resultado numérico cobrando um preço absurdo dos
 *    dois primeiros.
 *
 * A segunda tentativa de seleção, por `ganho` puro, é a rede de segurança: se a
 * escolha jogável não alcança a faixa nem no máximo, ainda pode existir um trio
 * pesado que alcança, e prometer o alcançável vale mais que prometer o cômodo.
 */
function planoConjunto(
  linhas: readonly LinhaNerdometro[],
  candidatos: readonly LinhaNerdometro[],
  minimo: number,
): readonly PassoParaSubir[] | null {
  const valores: ((linha: LinhaNerdometro, ganho: number) => number)[] = [
    (linha, ganho) => ganho * prioridade(linha, linha.meta),
    (_linha, ganho) => ganho,
  ]

  for (const valor of valores) {
    const escolhidos: LinhaNerdometro[] = []
    const noMaximo = new Map<string, number>()

    while (escolhidos.length < MAX_COMO_SUBIR) {
      const atual = comoSe(linhas, noMaximo)
      const notaAtual = media(atual)
      let melhor: { linha: LinhaNerdometro; valor: number } | null = null

      for (const linha of candidatos) {
        if (noMaximo.has(linha.jogoId)) continue
        const ganho = media(atual, linha.jogoId) - notaAtual
        if (ganho <= 0) continue
        const v = valor(linha, ganho)
        if (melhor === null || v > melhor.valor) melhor = { linha, valor: v }
      }

      if (melhor === null) break
      escolhidos.push(melhor.linha)
      noMaximo.set(melhor.linha.jogoId, melhor.linha.meta)
    }

    // Um jogo só não é plano — esse caso já foi resolvido por `alvoParaFaixa`.
    if (escolhidos.length < 2) continue
    if (Math.round(media(comoSe(linhas, noMaximo))) < minimo) continue

    // O menor esforço comum que ainda chega. Em centésimos do que falta, porque
    // os alvos são inteiros e mais resolução do que isso não muda pontuação
    // nenhuma. `Math.ceil` garante `alvo > recorde`: um passo com `faltam: 0`
    // seria uma linha na tela mandando fazer o que já está feito.
    const comEsforco = (centesimos: number): ReadonlyMap<string, number> =>
      new Map<string, number>(
        escolhidos.map((l): [string, number] => [
          l.jogoId,
          l.recorde + Math.ceil((centesimos / 100) * (l.meta - l.recorde)),
        ]),
      )

    let baixo = 1
    let alto = 100
    while (baixo < alto) {
      const meio = Math.floor((baixo + alto) / 2)
      if (Math.round(media(comoSe(linhas, comEsforco(meio)))) >= minimo) alto = meio
      else baixo = meio + 1
    }

    const alvos = comEsforco(baixo)
    // Na tela, o mais jogado primeiro: aqui os três são uma lista de tarefas e
    // não alternativas, então a ordem não escolhe nada — ela só decide por onde
    // a pessoa começa, e começar pelo jogo conhecido é o que faz começar.
    return escolhidos
      .map((l) => passo(l, alvos.get(l.jogoId) as number))
      .sort((a, b) => b.partidas - a.partidas)
  }

  return null
}

function montarComoSubir(
  linhas: readonly LinhaNerdometro[],
  minimo: number | null,
): { comoSubir: readonly PassoParaSubir[]; subirPedeMaisDeUmJogo: boolean } {
  // Já na faixa mais alta: não há o que recomendar.
  if (minimo === null) return { comoSubir: [], subirPedeMaisDeUmJogo: false }

  // Jogo no máximo não entra: não há pontuação a pedir dele. No máximo *hoje* —
  // quem bateu a meta há um ano e anda longe dela volta a ser candidato, que é
  // justamente o ponto da janela.
  const candidatos = linhas.filter((l) => l.vigente < l.meta)

  const alcancam = candidatos
    .map((linha) => ({ linha, alvo: alvoParaFaixa(linhas, linha, minimo) }))
    .filter((c): c is { linha: LinhaNerdometro; alvo: number } => c.alvo !== null)

  if (alcancam.length > 0) {
    return {
      comoSubir: alcancam
        .sort((a, b) => prioridade(b.linha, b.alvo) - prioridade(a.linha, a.alvo))
        .slice(0, MAX_COMO_SUBIR)
        .map((c) => passo(c.linha, c.alvo)),
      subirPedeMaisDeUmJogo: false,
    }
  }

  // Ninguém sozinho chega lá — o caso comum agora que são 69 critérios. Se um
  // punhado de jogos fecha a conta, a recomendação continua sendo uma promessa
  // cumprível, só que repartida. Ver `planoConjunto`.
  const plano = planoConjunto(linhas, candidatos, minimo)
  if (plano !== null) return { comoSubir: plano, subirPedeMaisDeUmJogo: true }

  // Nem três jogos no máximo alcançam. Em vez de inventar um alvo que não cumpre
  // o que promete, devolvemos os que mais aproximam — aqui o critério volta a ser
  // o rendimento puro (`potencial`), porque a pergunta mudou de "o que você
  // faria" para "por onde o caminho passa".
  return {
    comoSubir: [...candidatos]
      .sort((a, b) => b.potencial - a.potencial)
      .slice(0, MAX_COMO_SUBIR)
      .map((l) => passo(l, l.meta)),
    subirPedeMaisDeUmJogo: candidatos.length > 0,
  }
}

/**
 * O placar vigente e o tempo parado, lidos do histórico.
 *
 * Duas defesas contra banco velho, e as duas importam porque este app guarda
 * tudo em `localStorage` desde 2025:
 *
 * - **Histórico vazio.** O formato antigo não guardava partida nenhuma, e a
 *   migração aceita isso (ver `validarEntrada`). Sem histórico, o recorde é a
 *   única evidência que existe — usá-lo é melhor que zerar a nota de quem jogou
 *   antes do formato novo.
 * - **Data ilegível ou no futuro.** `Date.parse` devolve `NaN` para lixo, e
 *   relógio de máquina anda para trás. Os dois viram "jogado agora", que é o
 *   lado seguro: o erro não pode ser derrubar a nota de alguém.
 */
function lerJanela(entrada: Entrada | undefined, agoraMs: number, meta: number) {
  if (!entrada) return { vigente: 0, diasParado: 0, limpa: false }

  const recentes = entrada.historico.slice(0, PARTIDAS_NA_JANELA)
  const vigente =
    recentes.length > 0
      ? Math.max(...recentes.map((p) => p.pontuacao))
      : entrada.recorde.pontuacao

  const quando = Date.parse(entrada.ultimaEmISO || entrada.recorde.emISO)
  const diasParado = Number.isNaN(quando) ? 0 : Math.max(0, (agoraMs - quando) / DIA_MS)

  /**
   * Limpa é bater a meta **sem errar nenhuma carta**, e as duas condições são
   * uma coisa só: zero erro num jogo abandonado na terceira pergunta não é
   * maestria, é uma partida curta. Vale só dentro da janela, como o resto —
   * senão o bônus seria vitalício e a ferrugem não alcançaria justamente quem
   * mais deveria revisar.
   *
   * Banco antigo sem histórico não ganha o bônus: `completou` existe no recorde,
   * mas contagem de erros não, e inventar que foi limpa seria dar 15% de graça.
   */
  const limpa = recentes.some((p) => p.erros === 0 && p.pontuacao >= meta)

  return { vigente, diasParado, limpa }
}

export interface Ofensiva {
  /** Dias seguidos com pelo menos uma partida. */
  readonly dias: number
  /** A maior sequência que já houve, para a de hoje ter com o que se comparar. */
  readonly recorde: number
  /** Já jogou hoje. Com `false` e `dias > 0`, a sequência vence à meia-noite. */
  readonly hoje: boolean
}

/** O dia local de uma data, como `2026-09-18`. */
function diaLocal(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/**
 * A ofensiva: dias seguidos jogando.
 *
 * **Dia local, não UTC.** Quem joga às 21h em Brasília está no dia seguinte em
 * UTC, e uma sequência que quebra porque o jogador virou a noite no fuso errado
 * é o tipo de defeito que ninguém consegue reportar direito.
 *
 * **A sequência não morre no instante em que o dia vira.** Se a última partida
 * foi ontem, a ofensiva continua de pé e o mostrador avisa que ela vence hoje —
 * `hoje` é `false` e a tela cobra. Zerar à meia-noite em ponto puniria quem
 * acordou e ainda não jogou, e deixaria o número mentindo metade do dia.
 *
 * **Sai do histórico, que tem teto de 500 partidas por jogo** (ver
 * `LIMITE_HISTORICO`). Para a sequência atual isso é irrelevante — ela vive na
 * ponta recente —, mas o recorde de dias pode encolher se um jogo muito jogado
 * empurrar as partidas antigas para fora. Guardar a sequência num contador
 * próprio no banco resolveria, ao preço de mais um estado que pode divergir do
 * histórico; medir sempre do histórico nunca mente sobre o que está lá.
 */
export function ofensiva(banco: Banco, agora: Date = new Date()): Ofensiva {
  const dias = new Set<string>()
  for (const entrada of Object.values(banco.entradas)) {
    for (const p of entrada.historico) {
      const quando = new Date(p.emISO)
      if (!Number.isNaN(quando.getTime())) dias.add(diaLocal(quando))
    }
  }

  if (dias.size === 0) return { dias: 0, recorde: 0, hoje: false }

  const hoje = diaLocal(agora)
  const ontem = diaLocal(new Date(agora.getTime() - DIA_MS))
  const jogouHoje = dias.has(hoje)

  // Conta para trás a partir do último dia que conta: hoje, ou ontem se hoje
  // ainda não houve partida.
  let atual = 0
  if (jogouHoje || dias.has(ontem)) {
    // Meio-dia pela mesma razão do laço do recorde: somar e subtrair 24h a
    // partir do meio-dia nunca escorrega de dia.
    const cursor = new Date(agora)
    cursor.setHours(12, 0, 0, 0)
    if (!jogouHoje) cursor.setTime(cursor.getTime() - DIA_MS)
    while (dias.has(diaLocal(cursor))) {
      atual++
      cursor.setTime(cursor.getTime() - DIA_MS)
    }
  }

  // O recorde: a maior corrida dentro do conjunto. Ordenar e andar é O(n log n)
  // no número de *dias distintos*, não de partidas.
  const ordenados = [...dias].sort()
  let recorde = 0
  let corrida = 0
  let anterior: string | null = null
  for (const dia of ordenados) {
    // Meio-dia, e não meia-noite, para somar 24h sem cair na véspera nos dias em
    // que o horário de verão começa ou termina.
    const seguido =
      anterior !== null &&
      diaLocal(new Date(new Date(`${anterior}T12:00:00`).getTime() + DIA_MS)) === dia
    corrida = seguido ? corrida + 1 : 1
    if (corrida > recorde) recorde = corrida
    anterior = dia
  }

  return { dias: atual, recorde: Math.max(recorde, atual), hoje: jogouHoje }
}

/**
 * O quanto a ferrugem daquele jogo pesa: fração perdida × peso. É o que ordena a
 * lista de enferrujados — perder 30% de um jogo de peso 4 custa mais nota que
 * perder 30% de uma aritmética, e a ordem tem de dizer isso.
 */
const custoDe = (l: LinhaNerdometro) => l.fracao * (1 - l.ferrugem) * l.peso

/**
 * `agora` é parâmetro, e não `new Date()` lá dentro, porque a ferrugem fez a
 * nota depender do relógio: sem isto não há como testar "três meses depois" sem
 * mexer no relógio do processo.
 */
export function calcular(banco: Banco, agora: Date = new Date()): Nerdometro {
  const agoraMs = agora.getTime()

  const cru = CRITERIOS.map((c) => {
    const jogo = JOGOS.find((j) => j.id === c.jogoId)
    const entrada = banco.entradas[c.jogoId]
    const recorde = entrada?.recorde.pontuacao ?? 0
    const { vigente, diasParado, limpa } = lerJanela(entrada, agoraMs, c.meta)
    // Sem `min(1, …)`: a meta virou o começo do valor cheio, não o fim. Ver
    // `TETO_DO_JOGO`.
    const fracao = Math.min(TETO_DO_JOGO, vigente / c.meta + (limpa ? BONUS_DE_LIMPEZA : 0))

    return {
      jogoId: c.jogoId,
      nome: jogo?.nome ?? c.jogoId,
      icone: jogo?.icone ?? '?',
      area: c.area,
      categoria: jogo?.categoria ?? null,
      recorde,
      vigente,
      meta: c.meta,
      fracao,
      ferrugem: ferrugemEm(diasParado),
      diasParado: Math.floor(diasParado),
      peso: c.peso,
      potencial: 0,
      partidas: entrada?.partidas ?? 0,
      limpa,
      dominado: fracao >= 1,
      superado: fracao > 1,
      naNota: entraNaNota({ vigente, partidas: entrada?.partidas ?? 0, fracao }),
    }
  })

  const base = media(cru)

  // O potencial precisa da nota inteira recalculada, não de uma fração do peso
  // total: para um jogo ainda intocado, levá-lo ao máximo mexe nos dois lados
  // da divisão.
  const linhas: readonly LinhaNerdometro[] = cru.map((l) => ({
    ...l,
    potencial: media(cru, l.jogoId) - base,
  }))

  const nota = Math.round(base)

  const indiceFaixa = degrauDe(nota)
  const faixa = FAIXAS[indiceFaixa] as Faixa
  const acima = FAIXAS[indiceFaixa + 1]

  const areas = AREAS.map((area): NotaArea => {
    const daArea = linhas.filter((l) => l.area === area)
    return {
      area,
      // Mesma regra da nota geral: área só conta o que foi jogado dentro dela.
      nota: Math.round(media(linhas, undefined, (l) => l.area === area)),
      dominados: daArea.filter((l) => l.dominado).length,
      jogos: daArea.length,
    }
  })

  const categorias = CATEGORIAS.map((categoria): NotaCategoria => {
    const daCategoria = linhas.filter((l) => l.categoria === categoria)
    const jogados = daCategoria.filter((l) => l.naNota).length

    return {
      categoria,
      // Mesma `media`, mesmos pesos, mesma curva — só o filtro muda. Se a nota
      // por matéria tivesse fórmula própria, as duas divergiriam no primeiro
      // ajuste de balanceamento.
      nota: jogados === 0 ? null : Math.round(media(linhas, undefined, (l) => l.categoria === categoria)),
      jogados,
      dominados: daCategoria.filter((l) => l.dominado).length,
      jogos: daCategoria.length,
    }
  })

  // Tempo e partidas somam o banco inteiro, não só os critérios.
  const todas = Object.values(banco.entradas)

  const { comoSubir, subirPedeMaisDeUmJogo } = montarComoSubir(linhas, acima?.minimo ?? null)

  return {
    nota,
    faixa,
    proximaFaixa: acima ? { faixa: acima, falta: acima.minimo - nota } : null,
    // No topo não há próximo elo, mas há para onde crescer: o arco passa a medir
    // o caminho de `Ultra Virgem` até `NOTA_MAXIMA`, que é o teto de verdade da
    // escala. Antes ele ficava cheio no instante em que a pessoa chegava lá, e
    // parava de dizer qualquer coisa justamente para quem mais joga.
    progressoNoDegrau: acima
      ? Math.round(((nota - faixa.minimo) / (acima.minimo - faixa.minimo)) * 100)
      : Math.min(
          100,
          Math.round(
            ((nota - faixa.minimo) / Math.max(1, NOTA_MAXIMA - faixa.minimo)) * 100,
          ),
        ),
    comoSubir,
    subirPedeMaisDeUmJogo,
    linhas,
    areas,
    categorias,
    proximoPasso: [...linhas].sort((a, b) => b.potencial - a.potencial)[0] ?? null,
    jogados: linhas.filter((l) => l.naNota).length,
    emExperiencia: linhas.filter((l) => l.vigente > 0 && !l.naNota),
    enferrujados: linhas
      .filter((l) => l.naNota && l.ferrugem < 1)
      .sort((a, b) => custoDe(b) - custoDe(a)),
    // Contra a mesma média sem ferrugem nenhuma: é a leitura que responde "por
    // que a minha nota caiu se eu não joguei pior".
    podeCertificar: faixa.indice >= indiceDoCertificado(),
    ofensiva: ofensiva(banco, agora),
    custoDaFerrugem: Math.max(
      0,
      Math.round(media(linhas.map((l) => ({ ...l, ferrugem: 1 })))) - nota,
    ),
    total: linhas.length,
    dominados: linhas.filter((l) => l.dominado).length,
    partidas: todas.reduce((s, e) => s + e.partidas, 0),
    tempoMs: todas.reduce(
      (s, e) => s + e.historico.reduce((t, p) => t + p.duracaoMs, 0),
      0,
    ),
  }
}
