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

## Pendências

- **Publicar em nerd.jaopd.dev.** O DNS já está configurado e o workflow pronto
  (roda os testes antes do deploy). Falta criar o repo, dar push e apontar
  Settings → Pages → Source para "GitHub Actions".
- **Export/import mais decente.** O import ainda usa `window.prompt` e
  sobrescreve tudo sem preview nem confirmação — ação destrutiva demais para um
  botão. Ideia: preview do que vem, e opção de *juntar* em vez de substituir.
- **Busca de data em π.** O script de Chudnovsky chega a 10 milhões de casas em
  89s, mas estourou o limite de string do V8 em 100 milhões (o chute inicial do
  Newton passava por `toString(2)`). `11/01` está na casa 2.779 e `110107` na
  610.034; a data completa precisa de ~10⁸ casas.
- **Lantanídeos.** Não é código: são 15 dos 40 elementos que faltam na tabela, e
  o bloco mais fácil de atacar por vir em sequência.
