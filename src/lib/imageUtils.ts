/**
 * 画像ファイルをリサイズして圧縮する
 * @param file 元の画像ファイル
 * @param maxSize 最大サイズ（幅・高さの最大値）
 * @param quality 圧縮品質（0-1）
 * @returns リサイズ・圧縮された画像のBlob
 */
export async function resizeImage(
  file: File,
  maxSize: number = 300,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // キャンバスを作成
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // 正方形にリサイズ
        const size = Math.min(img.width, img.height)
        const scale = maxSize / size
        const newSize = Math.min(size * scale, maxSize)

        canvas.width = newSize
        canvas.height = newSize

        // 中央でクロップして描画
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2

        ctx.drawImage(
          img,
          sx, sy, size, size,
          0, 0, newSize, newSize
        )

        // Blobに変換
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * ファイルが画像かどうかをチェック
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * ファイルサイズが制限内かチェック
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}
