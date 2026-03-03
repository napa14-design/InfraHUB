# Guia de Texto PT-BR

## Objetivo
Padronizar a linguagem da interface e evitar problemas de encoding (mojibake).

## Regras
- Use português brasileiro claro e direto.
- Evite abreviações ambíguas.
- Prefira termos consistentes: `Próximo`, `Ação`, `Conformidade`, `Vencido`, `Salvar`, `Excluir`.
- Mensagens de erro devem ser objetivas e indicar ação sugerida.

## Encoding
- Todos os arquivos de código e documentação devem ficar em `UTF-8` sem BOM.
- Evite copiar texto de fontes com encoding desconhecido.
- Antes de commitar, faça varredura por padrões comuns de mojibake (`Ã§`, `Ã£`, `Ã¡`, `â`).

## Padrões de UI
- Botões de ação crítica devem ter estado de carregamento com texto explícito.
- Enquanto uma ação assíncrona está em andamento, o botão deve ficar `disabled`.
- Sempre exibir feedback final via toast (`success`, `warning`, `error`).

## Checklist rápido
- Texto com acentuação correta?
- Sem `Ã`/`?` indevidos?
- Rótulos e mensagens consistentes com o restante do módulo?
- Ação assíncrona com loading, bloqueio de clique e feedback?
