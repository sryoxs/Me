---
name: brainer-ordenar-boveda
description: Habilidad de Brainer "Ordenar la bóveda". El Archivista clasifica capturas, etiqueta y enlaza; el Tejedor busca conexiones entre notas. Deja un informe y notas de tipo conexión.
---

# Ordenar la bóveda

1. Lee `/engine/vault` completo.
2. Invoca al subagente **brainer-archivista** con las notas de tipo `captura` o sin etiquetas: devuelve, por nota, tipo sugerido, etiquetas y enlaces. Aplica solo etiquetas y enlaces (POST `/sync` con la nota actualizada, `updated` = ahora). Nunca borres.
3. Invoca al subagente **brainer-tejedor** con las notas de los últimos 14 días: crea una nota tipo `conexion` por cada conexión encontrada (3–5), etiquetas `conexion, claude`.
4. Informe final (tipo `informe`, etiquetas `informe, claude, ordenar-boveda`): qué se clasificó, qué se enlazó, duplicados detectados, conexiones creadas ([[Título]]), y `## Siguiente paso`.
