declare module 'fast-average-color' {
    export interface FastAverageColorOptions {
        Algorithm?: 'simple' | 'sqrt' | 'dominant';
        mode?: 'precision' | 'speed';
        step?: number;
        left?: number;
        top?: number;
        width?: number;
        height?: number;
        silent?: boolean;
        crossOrigin?: string;
    }

    export interface FastAverageColorResult {
        value: [number, number, number, number];
        rgb: string;
        rgba: string;
        hex: string;
        hexa: string;
        isDark: boolean;
        isLight: boolean;
        error?: any;
    }

    export class FastAverageColor {
        getColor(resource: HTMLImageElement | string | null, options?: FastAverageColorOptions): FastAverageColorResult;
        getColorAsync(resource: HTMLImageElement | string | null, options?: FastAverageColorOptions): Promise<FastAverageColorResult>;
        getColorFromArray4(arr: number[] | Uint8Array | Uint8ClampedArray, options?: FastAverageColorOptions): [number, number, number, number];
        destroy(): void;
    }
}
