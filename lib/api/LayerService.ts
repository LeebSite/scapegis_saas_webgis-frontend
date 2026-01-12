import http from "./http";
import type { Layer } from "../types";

export const layerAPI = {
    /**
     * Get all available layers (filtered by user subscription level)
     * GET /layers
     */
    getAvailableLayers: () => http.get<Layer[]>("/layers"),

    /**
     * Get layer details by ID
     * GET /layers/{id}
     */
    getLayerById: (layerId: string) => http.get<Layer>(`/layers/${layerId}`),
};
