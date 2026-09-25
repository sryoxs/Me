# Me

## Ruflo: tus agentes

Este repo trae [Ruflo](https://www.npmjs.com/package/ruflo) v3.45.0 (antes claude-flow) conectado a Claude Code.

- `.mcp.json` registra el servidor MCP `claude-flow` (`npx ruflo@3.45.0 mcp start`), que ofrece unas 280 herramientas: agentes, swarms, memoria, tareas y más.
- `.claude/agents/`, `.claude/commands/` y `.claude/skills/` traen los agentes, comandos y skills de Ruflo.
- `.claude/settings.json` activa los hooks de Ruflo.
- `.claude-flow/config.yaml` guarda la configuración (topología hierarchical-mesh, 15 agentes como máximo).

### Uso

Abre Claude Code en este repo, aprueba el servidor MCP `claude-flow` y pide cosas como:

- "Crea un swarm con un coder, un tester y un reviewer para implementar X"
- "Lanza un agente researcher que investigue Y"

Desde la terminal:

```bash
npx ruflo@3.45.0 swarm init            # inicializa un swarm
npx ruflo@3.45.0 agent spawn -t coder  # lanza un agente
npx ruflo@3.45.0 status                # estado del sistema
npx ruflo@3.45.0 doctor                # diagnóstico
```
