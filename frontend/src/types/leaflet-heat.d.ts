import "leaflet";

declare module "leaflet" {
  export type HeatLatLngTuple = [number, number, number];

  export interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }

  export function heatLayer(latlngs: HeatLatLngTuple[], options?: HeatLayerOptions): Layer;
}
