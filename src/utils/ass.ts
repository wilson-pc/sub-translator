export function restoreDialogsToASS(
    originalContent: string,
    translatedDialogs: string[]
  ) {
    const lines = originalContent.split('\n')
    let dialogIndex = 0
  
    const updatedLines = lines.map((line) => {
      if (
        line.startsWith('Dialogue:') &&
        dialogIndex < translatedDialogs.length
      ) {
        const translatedText = translatedDialogs[dialogIndex];

        // Si el diálogo traducido es vacío, es un placeholder de dibujo vectorial:
        // preservar la línea original intacta sin modificarla.
        if (translatedText === '') {
          dialogIndex++;
          return line;
        }

        // Captura la parte inicial y también las etiquetas ASS
        const match = line.match(
          /(Dialogue:[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,)(\{[^}]*\})?(.*)/
        )
  
        if (match && match[1]) {
          const initialPart = match[1] // Parte antes del texto
          const assTags = match[2] || '' // Etiquetas ASS como {\bord5\blur15}
          const newDialog = translatedText
            .replace(/\n/g, '\\N') // Reconvertir saltos de línea
            .trim()
  
          dialogIndex++;
          // Restaurar la línea manteniendo las etiquetas originales
          return `${initialPart}${assTags}${newDialog}`
        }
      }
      return line
    })
  
    return updatedLines.join('\n')
  }

  export const triggerFileDownload = (filename: string, content: string) => {
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
  }
  