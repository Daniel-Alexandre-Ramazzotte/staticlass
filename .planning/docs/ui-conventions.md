# UI — Convenções e Paleta

> Use quando criar ou modificar telas, componentes visuais ou estilos.

## Paleta de cores

Definida em `src/constants/style.tsx`. Valores canônicos:

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` / `PRIMARY` | `#1E63C3` | Cor principal, botões, header |
| `primaryBlue` | `#0074c3` | Variante de azul |
| `primaryGreen` | `#55bf44` | Acertos, confirmações, XP |
| `darkBlue` | `#093d60` | Fundos escuros, cards profundos |
| `background` / `BG` / `CARD` | `#002272ff` | Background de telas |
| `red` | `#f65151` | Erros, alertas |
| `offWhite` | `#fcfcfc` | Texto claro sobre fundo escuro |
| `accent` | `#283cad9f` | Container do quiz (semi-transparente) |

**Nota:** `PRIMARY = #1E63C3` é o valor ativo. `primaryBlue = #0074c3` existe na paleta mas é variante — não substituir um pelo outro sem verificar uso.

## Fontes

| Constante | Fonte |
|-----------|-------|
| `primaryFontA` | ChauPhilomeneOne |
| `primaryFontB` | AoboshiOne |
| `primaryFontC` | Carlito |

## Bibliotecas UI

- **Tamagui** — componentes principais e theming; usar `tamaguiStyles` de `style.tsx` para botões Tamagui
- **react-native-paper** — componentes secundários
- **@tamagui/lucide-icons** — ícones

## Componentes reutilizáveis

Buscar em `src/components/`:
- `AppButton` — botão padrão do app
- `CustomAccordion` — accordion para listas expansíveis

## Padrão de StyleSheet

Estilos globais exportados como `default` de `style.tsx`. Para estilos Tamagui inline, usar `tamaguiStyles`.
Não criar estilos inline em telas — adicionar ao StyleSheet global ou criar StyleSheet local no arquivo da tela.
