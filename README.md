# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Metronome

  Metrônomo web construido com React, TypeScript e Vite. A aplicação usa a Web Audio API para gerar cliques precisos no navegador e oferece recursos para prática musical.

  ## Recursos

  - Controle de tempo entre 20 e 300 BPM, com ajuste manual e Tap Tempo.
  - Configuração de fórmula de compasso, unidade de tempo e de 1 a 8 subdivisões.
  - Editor de padrão de subdivisões com acentos, cliques normais e silêncios.
  - Indicadores visuais do tempo, subdivisão e compasso atual.
  - Modo de tempo progressivo, com aumento automático do BPM até um limite.
  - Modo de treino, alternando compassos audíveis e silenciosos.
  - Criação, seleção, atualização e exclusão de presets.
  - Presets salvos localmente no navegador por meio do `localStorage`.

  ## Requisitos

  - Node.js 20.19+ ou 22+
  - npm
  - Um navegador com suporte a Web Audio API

  ## Executar localmente

  ```bash
  npm install
  npm run dev
  ```

  Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`.

  O áudio é iniciado quando o metrônomo é ativado, seguindo as políticas de autoplay do navegador.

  ## Scripts

  | Comando | Descrição |
  | --- | --- |
  | `npm run dev` | Inicia o servidor de desenvolvimento com hot reload. |
  | `npm run build` | Verifica os tipos e gera o build de produção em `dist/`. |
  | `npm run preview` | Serve localmente o build de produção. |
  | `npm run lint` | Executa o ESLint. |
  | `npm test` | Executa os testes uma vez com Vitest. |
  | `npm run prepare` | Inicializa o Husky no checkout local. |

  ## Qualidade e CI

  O Husky executa `npm run lint` e `npm test` antes de cada commit por meio de `.husky/pre-commit`.

  A pipeline do GitHub Actions em `.github/workflows/ci.yml` roda em pushes para `main` e em pull requests. Ela instala as dependências com `npm ci` e executa lint, testes e build.

  ## Estrutura principal

  ```text
  src/
    audio/       Motor de áudio do metrônomo e testes relacionados
    hooks/       Estado e controles do metrônomo
    types/       Tipos compartilhados
    App.tsx      Interface principal
  ```
