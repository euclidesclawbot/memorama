# Memorama MX

MVP de memorama configurable:
- tamaño del tablero (4x4 o 6x6)
- modo de juego: clásico o quiz con timer
- toggle de dark mode
- mejoras de accesibilidad visual (focus visible/contraste)
- contenido configurable (JSON)
- emparejar **personaje** con su **contribución**

Contenido inicial: personajes históricos de México y su aporte al país.

## Ejecutar local

Como usa módulos ES, sirve abrirlo con un servidor local:

```bash
cd memorama-mx
python3 -m http.server 8080
```

Luego abre:

`http://localhost:8080`

## Formato de contenido personalizado

```json
[
  {
    "person": "Nombre",
    "contribution": "Aporte",
    "image": "https://..."
  }
]
```

- `person` y `contribution` son obligatorios.
- `image` es opcional.
