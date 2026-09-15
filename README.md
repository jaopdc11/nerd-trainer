# Nerd Trainer

Treino diário de memorização nerd: senta alguns minutos, digita um pouco, tenta bater o
recorde de ontem. Sem contas, sem servidor, sem ranking — os recordes ficam no
`localStorage` da própria máquina.

No ar em **[nerd.jaopd.dev](https://nerd.jaopd.dev)**.

## As quatro mecânicas

Quase toda ideia nerd de memorização cai numa destas quatro. Por isso o trabalho está nas
engines, e cada jogo novo é só um arquivo de dados.

| Mecânica | Como funciona | Jogos |
|---|---|---|
| **Sequência** | Morte súbita, item a item. Ao errar, mostra os dez seguintes para decorar | π (10 mil casas), e, φ, √2, primos, Fibonacci, potências de 2 |
| **Grade** | Preenche em ordem livre; cada acerto cai na célula certa | Tabela periódica (3 modos) |
| **Flashcard** | Baralho sorteado, digitado ou múltipla escolha | Alfabeto grego, prefixos SI, constantes físicas, fórmulas |
| **Gerador** | Exercícios criados na hora, 60s + 5s por acerto | Cálculo rápido, derivadas rápidas, ordem de grandeza |

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # 145 testes
npm run build
```

## Adicionar um jogo

É um arquivo em `src/games/` e uma linha em `src/core/registry.ts`. Nada de engine, rota,
storage ou UI precisa ser tocado:

```ts
export const potencias2Jogo: JogoSequencia = {
  id: 'potencias-2',
  mecanica: 'sequencia',
  nome: 'Potências de 2',
  // ...
  config: () => ({
    entrada: 'termo',
    teclado: 'numerico',
    total: 65,
    // BigInt obrigatório: String(2 ** 64) devolve ...552000, não ...551616.
    itemEm: (i) => (i > 64 ? null : (2n ** BigInt(i)).toString()),
  }),
}
```

## Datasets gerados

Três datasets são gerados por script e **não devem ser editados à mão**:

```bash
node scripts/gen-constants.mjs   # dígitos de π, e, φ, √2
node scripts/gen-elementos.mjs   # os 118 elementos e a grade
node scripts/gen-formulas.mjs    # 54 fórmulas, pré-renderizadas em MathML
```

O de constantes existe porque um dígito trocado no meio de π ensinaria errado por meses
sem ninguém notar. O teste **recomputa π por Euler** (o script usa Machin) e confere √2 e
φ pelas identidades `x²=2` e `φ²=φ+1` — caminhos diferentes dos que geraram os números,
para o teste não ser o próprio gerador se autoaprovando.

## Decisões que não são óbvias

- **Validação por tipo de resposta, nunca genérica.** "1.024" é mil e vinte e quatro num
  inteiro e é 1,024 numa constante física. A caixa de "Co" é decorativa num nome e é a
  informação inteira num símbolo — `Co` é cobalto, `CO` é monóxido de carbono.
- **Misericórdia com erro de digitação, mas só em nome longo.** Quem escreve
  "Molibidênio" sabe que é o Mo; quem digita `3,14158` não sabe π. Tolerância de um
  caractere vale só para `texto`, com ≥7 letras, e **nunca** quando a entrada também
  encosta em outro item do baralho — senão o jogo aceitaria a resposta do elemento vizinho.
- **`onChange`, nunca `onKeyDown`.** O GBoard do Android manda `keyCode 229` em teclas
  comuns; com `onKeyDown` o π ficaria injogável no celular.
- **MathML pré-renderizado no build.** O KaTeX custaria ~270 KB de runtime; o MathML sai
  a ~300 bytes por fórmula e o navegador desenha nativamente.
- **Roteamento por hash.** GitHub Pages não tem rewrite: com History API, F5 em
  `/jogo/pi` dá 404.
- **BigInt onde passa de 2⁵³.** `Number` não lança erro ao estourar, arredonda em
  silêncio: `String(2**64)` dá `18446744073709552000`, e o certo é `...551616`.
- **Português do Brasil, com teste.** É Nitrogênio e não Azoto, Xenônio e não Xénon. Um
  regex `/[óé]nio$/` sobre os 118 elementos pega a regressão inteira de uma vez.

## Deploy

Push na `main` dispara o workflow, que roda os testes antes de publicar. Duas
configurações ficam fora do repositório, em Settings → Pages:

1. **Source = GitHub Actions** (não "Deploy from a branch") — sem isso o job falha sem
   aparecer no log de build.
2. **Custom domain = `nerd.jaopd.dev`**, com "Enforce HTTPS" depois que o certificado sair.
