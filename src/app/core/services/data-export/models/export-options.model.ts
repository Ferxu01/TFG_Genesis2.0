export interface ExportOptions<T = any> {
    /**
     * Permite transformar cada elemento antes de exportar
     * Ej: { x, y, index }
     */
    mapper?: (item: T, index: number) => Record<string, any>;

    /**
     * Nombre del archivo sin extensión
     */
    fileName?: string;
}
