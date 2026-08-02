# Protocolo de trabajo con agentes

Este repositorio se desarrolla **por relevos** entre varias herramientas de IA
(Claude Code y Codex, principalmente). Nunca en paralelo: se trabaja con una,
y cuando se agota su límite se salta a la otra y se continúa donde quedó.

Este archivo es el contrato entre ellas. Léelo entero antes de tocar nada.

---

## La regla que manda sobre todas

> **Git es la verdad. El markdown es la intención.**

Los `.md` describen lo que alguien *pretendía* hacer. Git registra lo que
*ocurrió*. Cuando discrepen, gana git — y se corrige el markdown.

Por eso, **siempre**, antes de escribir una línea de código:

```bash
git log --oneline -10
git status
```

## Al empezar una sesión

1. `git log --oneline -10 && git status` (lo de arriba, no es opcional)
2. Lee **`docs/agents/HANDOFF.md`** — es lo primero que importa: dice dónde se
   quedó la sesión anterior y qué está a medio hacer.
3. Lee **`docs/agents/ROADMAP.md`** para saber en qué fase estamos.
4. Ojea las 3 últimas entradas de **`docs/agents/WORKLOG.md`**.
5. `docs/agents/CONTEXT.md` solo si necesitas hechos del proyecto que no
   recuerdes (rutas de Firestore, decisiones de arquitectura y su porqué).

## Al terminar una sesión

Esto es lo que hace que el relevo funcione. Si te quedas sin límite a mitad,
hazlo igualmente en cuanto puedas:

1. **Commit.** Aunque el trabajo esté a medias. Un commit `wip:` es
   infinitamente mejor que 20 archivos sueltos que el siguiente no entiende.
2. **Reescribe `docs/agents/HANDOFF.md`.** Entero, no añadiendo: describe el
   estado *actual*. Qué está terminado, qué está a medias y en qué archivo,
   qué era lo siguiente, y qué sabes que está roto.
3. **Añade una entrada arriba del todo en `docs/agents/WORKLOG.md`.** Esto sí
   es acumulativo: es la memoria larga del proyecto.
4. Si tomaste una decisión de arquitectura, anótala en `CONTEXT.md` **con su
   motivo**. Una decisión sin motivo se revierte por accidente al mes.

## Los archivos

| Archivo | Qué es | Cada cuánto cambia |
|---|---|---|
| `AGENTS.md` | Este protocolo | Casi nunca |
| `docs/agents/CONTEXT.md` | Hechos del proyecto y decisiones con su porqué | Raramente |
| `docs/agents/ROADMAP.md` | Fases del trabajo y su estado | Al cerrar una fase |
| `docs/agents/HANDOFF.md` | **Estado del relevo.** Se sobrescribe entero | Cada sesión |
| `docs/agents/WORKLOG.md` | Diario acumulativo, lo más reciente arriba | Cada sesión |

## Dónde se trabaja

- **Rama única:** `feat/mobile-v1`
- **Directorio único:** el checkout principal del repo
- **Servidor de desarrollo: puerto 3100**

> ⚠️ **No uses el puerto 3000.** Provocó un incidente real: se depuró durante
> horas una vista que no contenía los cambios, porque el servidor del 3000
> corría desde otro worktree. Si ves el 3000 ocupado, no asumas que es tuyo.

Los worktrees sueltos bajo `.codex/worktrees/` y `.claude/worktrees/` están
**obsoletos**. No trabajes en ellos.

## Cuando algo no encaja

Si te encuentras código que contradice lo que dicen estos archivos: **no lo
arregles a la fuerza**. Puede que el md esté desactualizado, o puede que sea
un bug real. Anótalo en `WORKLOG.md` y pregunta al usuario.

Lo mismo si un archivo tiene cambios que no esperabas: míralos antes de
sobrescribir. Puede ser trabajo de la sesión anterior que no llegó a commitear.
