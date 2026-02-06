
/**
 * Compresses an image file using Canvas API.
 * @param file The source File object
 * @param maxWidth Maximum width allowed (default 1024px)
 * @param quality JPEG quality 0-1 (default 0.6)
 */
export const compressImage = async (file: File, maxWidth = 1024, quality = 0.6): Promise<Blob> => {
    // 1. Basic Type Validation
    if (!file.type.startsWith('image/')) {
        return Promise.reject(new Error("Arquivo inválido. Selecione apenas imagens."));
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize maintaining aspect ratio
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error("Canvas context not available."));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed JPEG
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Falha na compressão do Canvas."));
                    },
                    'image/jpeg',
                    quality 
                );
            };
            img.onerror = (err) => reject(new Error("Erro ao carregar a imagem para processamento."));
        };
        reader.onerror = (err) => reject(new Error("Erro ao ler o arquivo."));
    });
};
