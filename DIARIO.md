# Diário — 15 de setembro de 2026

Do zero ao app jogável em um dia. 14 commits, 9.657 linhas, 153 testes.

## O pedido

Começou como "um jogo pra alívio acadêmico": decorar casas de π e preencher a
tabela periódica, guardando só o recorde no `localStorage`.

Ao abrir o leque de ideias, ficou claro que quase toda ideia nerd de memorização
cai em **quatro mecânicas**. Isso virou a decisão estruturante do projeto: o
trabalho está nas engines, e cada jogo novo é um arquivo de dados.

| Mecânica | Como funciona | Jogos |
|---|---|---|
| Sequência | Morte súbita, item a item; ao errar mostra os 10 seguintes | π, e, φ, √2, primos, Fibonacci, potências de 2 |
| Grade | Preenche em ordem livre, cada acerto cai na célula certa | Tabela periódica |
| Flashcard | Baralho sorteado, digitado ou múltipla escolha | Grego, prefixos SI, constantes, fórmulas |
| Gerador | Exercícios criados na hora, 60s + 5s por acerto | Cálculo rápido, derivadas, ordem de grandeza |

**15 jogos** no fim do dia.

## Decisões que valem lembrar

**Validação por tipo de resposta, nunca genérica.** `1.024` é mil e vinte e
quatro num inteiro e 1,024 numa constante física. A caixa de `Co` é decorativa
num nome e é a informação inteira num símbolo — `Co` é cobalto, `CO` é monóxido
de carbono. Por isso `EspecResposta` é união discriminada e cada tipo carrega o
próprio pipeline.

**Misericórdia com erro de digitação, com três travas.** Quem escreve
"Molibidênio" sabe que é o Mo; quem digita `3,14158` não sabe π. Tolerância de
um caractere vale só em `texto`, com ≥7 letras, e **nunca** quando a entrada
também encosta em outro item do baralho — senão o jogo aceitaria a resposta do
elemento vizinho.

**Card onde digitar é o obstáculo; digitação onde o desafio é lembrar.** Régua
que apareceu no meio do dia e organizou tudo: fórmulas, derivadas e constantes
viraram múltipla escolha (notação matemática e nome composto contra o relógio
medem teclado); grego, prefixos SI e tabela periódica continuam digitados
(palavra curta, sem relógio — card ali trocaria *recordar* por *reconhecer*).

**Auto-commit sem Enter, com uma sutileza.** A resposta é aceita assim que fica
inequívoca. No modo símbolo da tabela, `N` **não** podia commitar sozinho porque
também começa Na, Ne, Ni, Nb, Nd, No, Np e Nh. Só commita quando nada mais
continua a partir dele — e o jogo vai ficando mais fluido conforme a grade
enche. Ordem de grandeza segue exigindo Enter, porque `3e8` e `3,0e8` são ambas
válidas e não dá para saber quando o jogador terminou.

**BigInt onde passa de 2⁵³.** `Number` não lança erro ao estourar, arredonda em
silêncio: `String(2**64)` dá `18446744073709552000` e o certo é `...551616`. Um
jogo de memorização que ensina o dígito errado porque ele mesmo calculou errado
seria o pior defeito possível.

**Datasets gerados e conferidos por caminho independente.** π é gerado por
Machin e o teste **recomputa por Euler**; √2 e φ são conferidos pelas
identidades `x²=2` e `φ²=φ+1`. O teste não pode ser o próprio gerador se
autoaprovando. Âncora humana: o ponto de Feynman (casas 762–767 = `999999`).

**Português do Brasil com teste.** É Nitrogênio e não Azoto, Xenônio e não
Xénon. Um regex `/[óé]nio$/` sobre os 118 elementos pega a regressão inteira —
a contaminação vem de tradução automática e da Wikipédia lusófona.

**MathML pré-renderizado no build.** KaTeX custaria ~270 KB de runtime; o MathML
sai a ~300 bytes por fórmula e o navegador desenha nativamente. Zero KaTeX no
bundle final.

## Bugs encontrados, e como

Três dos melhores achados vieram de **jogar de verdade** e de **olhar os dados
reais**, não de revisar código.

**1. A partida não salvava ao sair.** Só gravava quando terminava "do jeito
certo" — relógio zerado, morte súbita, baralho completo. Fechar a aba com 50
acertos perdia os 50. Corrigido com `useSaveOnExit` (cleanup + `visibilitychange`
+ `pagehide`).

**2. Partidas fantasma e chaves órfãs.** O JSON exportado de uma sessão real
mostrou que **14% das runs gravadas tinham zero ponto** — o conserto do item 1
contava como partida quem só abria o jogo e voltava. O mesmo JSON revelou
`formulas::nome` e `formulas::escolha`, entradas órfãs de quando havia seleção
de modo.

**3. Recorde congelado — o pior do dia.** Consequência direta do item 1: ao
trocar de aba no meio de uma partida, o parcial era gravado com o runId daquela
run; ao terminar a **mesma** partida com pontuação maior, a idempotência via o
runId conhecido e **descartava o desfecho real**. Um recorde de 58 casas de π
não subia porque um 20 da mesma partida já tinha sido salvo antes. A
idempotência agora guarda a pontuação junto do runId, separando "regravar a
mesma coisa" de "terminar uma partida salva pela metade".

**4. Maiúsculas gregas ambíguas.** 14 das 24 são graficamente idênticas a letras
latinas (Α=A, Β=B, Η=H, Ρ=P, Χ=X). Cheguei a mudar para mostrar o par
`Λ λ` — e **revertido**, porque o caso concreto não era ambiguidade, era o
jogador ter esquecido mesmo. Fica registrado caso volte a incomodar.

## Retrabalho que valeu

- **Modos removidos.** Cada jogo tinha 3 modos e uma tela de seleção; virou um
  modo só por jogo, sempre "digite o nome".
- **Layout.** Estava preso em `max-w-2xl` num monitor de 1920.
- **Grade da tabela.** O `1fr` esticava a largura e estourava a altura das 10
  linhas, criando rolagem horizontal. Agora a célula é limitada pelos dois eixos.
- **Cor do Nerdômetro.** Primeiro um matiz girando com L e C fixos — cor
  chapada, "parece `p { color: purple }`". Agora são seis stops curados,
  interpolados nos três eixos do OKLCH.
- **Frações do cálculo rápido.** Saíram pelo mesmo motivo da notação nas
  derivadas; entraram raiz de quadrado perfeito e multiplicação 2×2 dígitos.

## Nerdômetro

Nota de 0 a 100 sobre 15 critérios. Três decisões:

1. **Cada jogo tem uma meta, não o total.** 118 elementos vale cheio, mas a meta
   de π é 100 casas — usar o total faria a nota depender de quantas casas eu
   resolvi embutir no dataset.
2. **Repertório pesa 2, cronometrado pesa 1.**
3. **Jogo não jogado conta zero**, o que impede tirar 100 treinando uma coisa só.

Nove faixas, de "zero. abriu isso aqui pra quê?" até "cara, vai arrumar uma
namorada".

## Estado no fim do dia

| | |
|---|---|
| Jogos | 15, em 4 mecânicas |
| Testes | 153, todos passando |
| Bundle | 112 KB gzip, sem KaTeX em runtime |
| Código | 9.657 linhas |
| Commits | 14 |
| Publicado | **não** — só local |

## Pendências ao fim do primeiro dia

- Publicar em nerd.jaopd.dev.
- Export/import mais decente — o import usava `window.prompt` e sobrescrevia
  tudo sem preview.
- **Busca de data em π.** O script de Chudnovsky chega a 10 milhões de casas em
  89s, mas estourou o limite de string do V8 em 100 milhões (o chute inicial do
  Newton passava por `toString(2)`). `11/01` está na casa 2.779 e `110107` na
  610.034; a data completa precisa de ~10⁸ casas.
- **Lantanídeos.** Não é código: são 15 dos 40 elementos que faltam na tabela, e
  o bloco mais fácil de atacar por vir em sequência.

---

# Segundo dia

De 15 para 26 jogos, e de 153 para 470 testes. Mas o que definiu o dia não
foram os jogos novos: foram **três bugs que só apareceram porque eu joguei de
verdade**, e um desenho de pontuação que estava punindo exatamente o que o app
pede.

## Os três bugs, e o que eles têm em comum

Os três eram invisíveis para o código e óbvios para quem jogava.

**1. Trocar de aba encerrava a partida.** O `useSaveOnExit` do primeiro dia
existia para não perder progresso ao sair — e chamava `finalizar`, que termina
o jogo. Salvar virou encerrar. Perdi uma partida de países no meio por causa
disso. Agora existe `gravar`, que só persiste, separado de `finalizar`.

**2. E aí o conserto criou o próximo.** Como uma partida passou a ser gravada
mais de uma vez, a tela de fim refazia a foto do recorde a cada gravação e lia
o que a gravação anterior tinha acabado de criar. Fechar 141 países anunciava
"Empatou o recorde" — a partida comparada com ela mesma. A foto agora é tirada
uma vez por `runId`, e o veredito acumula entre as gravações.

Esse é o mesmo bug do `1a5560d` do primeiro dia, pela terceira porta diferente.
A lição não é sobre gravação: é que **"quando" se lê um valor é tão parte da
regra quanto o valor**, e isso não aparece em teste que monta o estado à mão.

**3. Não dava para pular.** Caiu a bandeira de Comores, eu não fazia ideia, e o
campo não envia resposta vazia — o jogo simplesmente travava. Saí com 1 ponto,
e aquele 1 virou meu recorde de bandeiras, valendo 8 pontos de Nerdômetro por
meses. O botão de pular não é conveniência, é a diferença entre um recorde
verdadeiro e um artefato da interface.

## O Nerdômetro estava medindo a coisa errada

Quatro mudanças, e cada uma saiu de uma reclamação concreta minha jogando.

**Jogo não jogado saiu da conta.** Era o contrário, e parecia inocente: o
denominador era a soma dos pesos de *todos* os critérios, então **lançar um
jogo novo derrubava a nota de todo mundo retroativamente**. Três jogos de
química levavam um 62 para 48 sem ninguém jogar pior. A trava contra tirar 100
maxando um jogo só mudou de lugar: vive na etiqueta "em N de M jogos", não na
fórmula. Misturar cobertura dentro da conta era justamente o que diluía.

**A fração virou côncava.** Ir de 0 a 40 países leva uma tarde; de 140 a 150
leva semanas. A escala linear dizia que o primeiro trecho vale 40 e o segundo
10, quando o esforço é o inverso. Num medidor que cobre 26 áreas, isso pune
quem faz o que o app pede — saber de tudo um pouco — e premia quem mói um jogo
só. O expoente 0,65 foi calibrado contra dados reais de uma sessão.

**Peso e meta não são a mesma alavanca**, e confundir as duas custou caro.
Peso não soma ponto: ele amplifica a fração. Subir países para peso 4 me fez
*perder* nota, porque eu estava em 29% nele. Peso responde "quanto este jogo
fala sobre alguém"; quem paga a dificuldade é a meta. A escala hoje vai de 0,5
(cálculo rápido) a 4 (tabela periódica, países, bandeiras, capitais).

**A meta dos países é a lista da ONU**, 195, e os 9 territórios são pontos
extras em cima disso. Fechar os 195 dispara um marco — mecanismo novo na
engine de grade, um subconjunto de células que, completo, vale um recado.

## Geografia: o que eu não sabia que ia ser o fácil

Bandeira era o meu medo e não foi problema: a mediana das 195 é **0,8 KB**.
O peso está em vinte brasões — a Sérvia sozinha tem 177 KB. Como asset
estático, cada carta paga só a sua.

O mapa-múndi custa 43 KB gzip a 110m; a 50m custaria 306 KB. Os 29
micro-estados viram ponto, porque no 110m não chegam a um pixel e país que não
dá para ver não dá para acertar.

**Português do Brasil, de novo.** O `world-countries` traz `translations.por`,
que é de Portugal: Irão, Vietname, Iémen, Polónia, Estónia, Chéquia. A mesma
armadilha do Azoto nos elementos, agora com a regra -ónia/-ônia. São 28
correções e um teste com regex mais lista explícita. Dois casos nem eram
lusitanismo: `Azerbeijão` e `São Vincente` são erro de digitação do pacote.

O mapa do Brasil quase saiu errado **sem quebrar**: a malha do IBGE vem com os
anéis no sentido oposto ao que o `d3-geo` espera, e como ele trata polígono
como região da esfera, cada estado virava "o planeta inteiro menos o estado".
O `fitSize` enxergava o mundo e o Brasil saía do tamanho de uma unha. Nada
falhava. Tem teste fixando o esqueleto — RR acima de RS, AC à esquerda de PB.

## Aceitar resposta como gente

Digitar "República Centro-Africana" perfeito contra o relógio mede
datilografia, não geografia. Agora a comparação usa chave compactada (sem
espaço, sem acento, sem pontuação), distância de Damerau, e limite escalado por
tamanho: 1 erro a partir de 7 caracteres, 2 a partir de 14, 3 a partir de 21.

O que segurou isso foi refazer uma medição que **estava errada**. O teste que
justificava desligar a tolerância nos países varria todas as formas contra
todas sem separar por país, e os cinco "pares perigosos" que ele achava eram
sinônimos do *mesmo* país. Refeito país contra país: **zero** pares ambíguos
entre os 195. Os mais próximos — Áustria/Austrália, Estônia/Letônia — estão a
distância 2 com limite 1.

De quebra, a trava de vizinhança quase não funcionava nas bandeiras: cada
engine passava as formas com uma normalização diferente da do alvo. Três
réguas se comparando.

## Um dado que mentia em silêncio

O JSON exportado tinha `9007199254740991` espalhado. Vinha da migração do
formato antigo de `ultimosRuns`, que inventava `MAX_SAFE_INTEGER` quando a
pontuação faltava. Como `registrar` compara `pontuacao <= jaGravada`, nenhuma
regravação daquele `runId` passava — o bug do recorde congelado, mais uma vez,
por outra porta ainda. Agora a run sem pontuação é descartada em vez de
inventada. **Inventar um valor plausível é pior que não ter valor.**

## Estado no fim do segundo dia

| | |
|---|---|
| Jogos | 26, nas mesmas 4 mecânicas |
| Categorias | 5 — entraram geografia e humanas |
| Testes | 470, todos passando |
| Bundle | 239 KB gzip |
| Código | ~17.900 linhas |
| Publicado | **não** |

## Pendências

- **Publicar.** O workflow escutava só `main` e o repositório está em `master`
  — nunca teria disparado. Corrigido, junto com o `public/CNAME`, que é o que
  o domínio custom exige quando o deploy vem do Actions.
- **Bundle em 239 KB.** As geometrias dos dois mapas somam ~100 KB e todo mundo
  baixa, mesmo jogando só π. O conserto é carregar sob demanda, e esbarra em
  `config()` ser síncrona.
- **O caso do Sudão.** Digitar "sudao" não commita sozinho enquanto "Sudão do
  Sul" estiver em jogo, porque um é prefixo do outro. O Enter funciona. Mantive
  a regra, que existe pelo caso do `N` contra Na/Ne/Ni — sem ela era impossível
  digitar sódio. Fica registrado caso volte a incomodar.
- **Busca de data em π** e **lantanídeos**, do primeiro dia, seguem de pé.
