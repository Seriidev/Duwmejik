export function downloadTemplate(title: string) {
  const blob = new Blob(
    [
      `Duwmejik\n${title}\n\nЭто демонстрационный файл макета. В рабочей версии здесь будет архив с исходниками.\n`,
    ],
    { type: 'text/plain;charset=utf-8' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/[^\p{L}\p{N}]+/gu, '-')}.txt`
  link.click()
  URL.revokeObjectURL(url)
}
