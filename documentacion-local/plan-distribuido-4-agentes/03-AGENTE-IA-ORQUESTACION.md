# Agente 3 - IA Orchestrator y Calidad de Hipotesis

## Tipo de rol

Especialista en diseno multi-agente, arbitraje de evidencia, scoring de hipotesis y politicas de iteracion.

## Mision

Asegurar que el sistema de analisis de bugs sea confiable, explicable y repetible, evitando conclusiones sin evidencia.

## Preguntas guia

- Como se orquesta el trabajo entre especialistas sin contradicciones?
- Como se mide confianza de hipotesis de forma transparente?
- Cuando iterar y cuando detener el analisis?
- Como reducir falsos positivos de "root cause"?

## Alcance

- Orquestador, especialistas y agente arbitro.
- Formato obligatorio de salida (schema unico).
- Rubrica de probabilidad y bandas de confianza.
- Politica de iteraciones y criterios de cierre.

## Entregables

1. Contrato JSON de salida comun para agentes.
2. Decision rubric (historical/code/repro evidence).
3. Convergence mapping (Top 3 nodos obligatorios).
4. Conflict matrix template (A vs B vs Arbitro).

## Criterios de aceptacion

- Ninguna conclusion final sin evidencia reproducible o bloqueo explicito.
- Existe umbral claro para decidir nueva iteracion.
- El reporte final permite auditoria tecnica.

## No hacer

- No crear demasiados agentes sin justificacion medible.
- No aceptar respuestas no estructuradas o no verificables.
