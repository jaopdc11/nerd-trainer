# Cobertura por elo — a decidir

Anotação para retomar. **Nada disto está implementado.**

## O problema

Um amigo do dono, na versão de produção, está com **nota 100 e o título mais alto
jogando um único jogo** — abriu a sequência de π num PC recém-formatado, bateu a
meta e pronto. A etiqueta "em 1 de 72 jogos" aparece ao lado, mas ninguém lê uma
etiqueta miúda quando o número grande diz 100.

Isso já estava escrito no código como risco assumido (decisão 3 de
`src/core/nerdometro.ts`: *"a trava contra tirar 100 maxando um jogo só não está
na fórmula, está na etiqueta"*). O caso real mostra que a etiqueta não segura.

E **piorou** com o que subiu agora: com a escala aberta (`TETO_DO_JOGO`), o mesmo
jogo único maxado e sem erros chega a 115.

## A regra pedida

> Para cada elo novo tem que ter jogado um mínimo de **X jogos**, e desses X
> jogos, atingido a meta em **Y** deles (Y menor que X).

Ou seja, a trava é **por elo**, não uma única porta: cada degrau do ranking exige
uma cobertura mínima (X jogos que pesam na nota) e uma profundidade mínima (Y
desses com a meta batida). O elo fica no teto que a cobertura permite, por mais
alta que a nota esteja.

## O que falta definir

1. **A tabela de X e Y por elo.** Provavelmente por patente, não por grau — 21
   pares de números seria balanceamento demais para manter. Algo como:

   | patente | X (jogos na nota) | Y (com a meta batida) |
   | --- | --- | --- |
   | Curioso | 1 | 0 |
   | CDF | ? | ? |
   | Nerd | ? | ? |
   | Virgem | ? | ? |
   | Ultra Virgem | ? | ? |

2. **X e Y são absolutos ou fração do catálogo?** Precisa ser **absoluto**. Com
   fração, lançar jogo novo rebaixaria todo mundo retroativamente, que é
   exatamente o defeito que a decisão 3 do nerdômetro existe para evitar — o
   catálogo já foi de 26 para 72 critérios e vai crescer de novo.

3. **O que a tela diz quando a nota permite e a cobertura não.** O elo não pode
   simplesmente parar sem explicação. Algo como "Virgem I precisa de 25 jogos na
   nota — você tem 12", no lugar de "faltam N pontos".

4. **Vale para o certificado?** Hoje o diploma libera em `Nerd V`
   (`ELO_DO_CERTIFICADO`). Com a trava, o elo já carrega a cobertura, então
   provavelmente não precisa de regra extra.

## Decisões já tomadas nesta conversa (e ainda não implementadas)

- **Classificatórias**: abaixo de ~10 jogos na nota, sem elo — "Não
  classificado", com o medidor mostrando quantos faltam. Combina com a regra
  acima e resolve o caso do jogo único já na porta de entrada.
- O dono também disse: *"não dá pra ter nota muito alta sem jogar mais de um
  jogo"* — ou seja, além do elo, a **nota** deve cair com pouca cobertura. Uma
  forma sem reintroduzir o defeito antigo é multiplicá-la por
  `√(jogados / alvo)`, com `alvo` **absoluto** (12, 20 ou 40 jogos foram as
  opções levantadas) e travado em 1 daí para cima. A severidade ficou **sem
  escolher** — é o próximo ponto da conversa.

  Para calibrar, o efeito medido com alvo 20: um banco de 4 jogos com nota 99 cai
  para 44; o do amigo, de 100 para 22; com 20 jogos, nada muda.

## Onde mexer

- `src/core/nerdometro.ts` — `calcular()` decide `faixa` a partir de `degrauDe(nota)`;
  a trava entra entre os dois. `jogados` e `dominados` já estão calculados ali.
- `src/components/Nerdometro.tsx` — o texto de "faltam N para <elo>" e a trilha
  de patentes precisam dizer o que está travando.
- `src/core/nerdometro.test.ts` — o `describe('o ranking')` é onde a escada é
  cobrada hoje.
