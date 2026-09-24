---
name: parte-del-dia
description: Organización diaria. Prepara el parte del día de Smith: correo que necesita acción (Gmail), agenda (Google Calendar), capturas sin procesar, tareas y repaso pendiente en Brainer, y las tres prioridades. Úsala cuando Smith diga «qué tengo hoy», «planifica el día», «mi parte», «prepárame la mañana» o «resumen del correo». Nunca responde correos ni crea eventos.
---

# Parte del día

## Proceso
1. Hora local de Smith (perfil de Brainer o America/Lima). Si es después de las 20:00, haz el parte de mañana y dilo.
2. **Correo** (conector Gmail, solo lectura): hilos de las últimas 24 h sin promociones ni sociales. Clasifica en Urgente (acción hoy: remitente, asunto, qué piden, fecha límite), Importante (esta semana) y Para leer (una línea cada uno). Si el conector no está disponible, escribe «correo: sin conector» y sigue.
3. **Agenda** (conector Google Calendar, solo lectura): eventos de hoy con hora; huecos libres de más de una hora. Sin conector: «agenda: sin conector».
4. **Vault**: cuántas notas hay en `00-INBOX/` sin procesar y qué dejó la última corrida (`.claude/ultima-corrida.md`).
5. **Brainer**: con `sincronizar-brainer` en modo lectura, trae recordatorios de hoy, tareas pendientes y tarjetas que tocan.
6. **Fechas detectadas**: cualquier entrega o cita que aparezca en correo o notas y no tenga recordatorio, listada como `30 de octubre` para que Brainer proponga uno.
7. **Tres prioridades**: elige tres, no más, con una línea de por qué cada una. Si Smith tiene metas en el CLAUDE.md, al menos una prioridad las sirve.

## Salida
- En la conversación: el parte en menos de 25 líneas.
- Y como nota en Brainer (vía `sincronizar-brainer`): título `Parte del día · <fecha>`, tipo `informe`, etiquetas `parte, claude`, con las mismas secciones, para que aparezca en el Centro de la app.

## Reglas
- Nunca respondas, archives ni etiquetes correos. Nunca crees ni muevas eventos.
- Nada de contraseñas, códigos ni datos bancarios en el parte.
- Si no hay nada urgente, dilo en la primera línea en vez de inflar la lista.
