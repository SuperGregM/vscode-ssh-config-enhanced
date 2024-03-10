import type {
  Disposable,
  DocumentFormattingEditProvider,
  FormattingOptions,
  ProviderResult,
  TextDocument,
  TextEdit,
} from 'vscode'
import { Range, languages, window } from 'vscode'
import { DOCUMENT_PROVIDER } from './utils'

function stringDifference(str1: string, str2: string) {
  let diff = ''
  for (let i = 0; i < Math.max(str1.length, str2.length); i++) {
    if (str1[i] !== str2[i]) {
      diff += str1[i] || '' // Adds the character from str1 if it exists
      diff += str2[i] || '' // Adds the character from str2 if it exists
    }
  }
  return diff
}

/**
 * Provides formatting for SSH configuration documents.
 */
export class SSHFormatProvider implements DocumentFormattingEditProvider {
  /**
   * Constructs a new instance of SSHFormatProvider.
   * @param disposables - The array of disposables to which the registration of the document formatting edit provider will be added.
   */
  constructor(disposables: Disposable[]) {
    disposables.push(languages.registerDocumentFormattingEditProvider(DOCUMENT_PROVIDER, this))
  }

  /**
   * Provides the formatting edits for the given document.
   * @param document - The document to be formatted.
   * @param options - The formatting options.
   */
  provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions): ProviderResult<TextEdit[]> {
    const editor = window.activeTextEditor
    if (!editor) {
      return
    }

    const text = document.getText()
    const formattedText = this.formatSshConfig(text)

    if (text === formattedText) {
      return
    }

    const fullRange = new Range(
      document.positionAt(0),
      document.positionAt(text.length),
    )

    editor.edit((editBuilder) => {
      editBuilder.replace(fullRange, formattedText)
    })
  }

  /**
   * Formats the SSH configuration text.
   * @param text - The SSH configuration text to be formatted.
   * @returns The formatted SSH configuration text.
   */
  private formatSshConfig(text: string): string {
    let isHostBlock = false
    let isFirstLine = true
    return text.split('\n').map((line, index, lines) => {
      if (line.trim().startsWith('Host ') || line.trim().startsWith('Match ')) {
        isHostBlock = true
        if (!isFirstLine && lines[index - 1].trim() !== '') {
          return `\n${line.trim()}`
        }
        return line.trim()
      } else if (line.trim() === '') {
        isHostBlock = false
        isFirstLine = false
        return line
      } else {
        isFirstLine = false
        return isHostBlock ? `  ${line.trim()}` : line.trim()
      }
    }).join('\n')
  }
}
