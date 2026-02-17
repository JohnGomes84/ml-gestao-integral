declare module "streamdown" {
  import type { ComponentType } from "react";
  export const Streamdown: ComponentType<{ children?: string }>;
}

declare module "@radix-ui/react-aspect-ratio";
declare module "@radix-ui/react-collapsible";
declare module "@radix-ui/react-context-menu";
declare module "@radix-ui/react-hover-card";
declare module "@radix-ui/react-menubar";
declare module "@radix-ui/react-navigation-menu";
declare module "@radix-ui/react-progress";
declare module "@radix-ui/react-radio-group";
declare module "@radix-ui/react-scroll-area";
declare module "@radix-ui/react-slider";
declare module "@radix-ui/react-toggle";
declare module "@radix-ui/react-toggle-group";
declare module "cmdk";
declare module "vaul";

declare module "embla-carousel-react" {
  export type UseEmblaCarouselType = [
    (instance: HTMLDivElement | null) => void,
    {
      canScrollPrev: () => boolean;
      canScrollNext: () => boolean;
      scrollPrev: () => void;
      scrollNext: () => void;
      on: (event: string, cb: (api: UseEmblaCarouselType[1]) => void) => void;
      off: (event: string, cb: (api: UseEmblaCarouselType[1]) => void) => void;
    } | null,
  ];

  export default function useEmblaCarousel(
    options?: { axis?: "x" | "y" } & Record<string, unknown>,
    plugins?: unknown,
  ): UseEmblaCarouselType;
}

declare module "input-otp" {
  import type { Context, FC, HTMLAttributes } from "react";

  export const OTPInput: FC<HTMLAttributes<HTMLDivElement> & Record<string, unknown>>;
  export const OTPInputContext: Context<{
    slots: Array<{
      char?: string;
      hasFakeCaret?: boolean;
      isActive?: boolean;
    }>;
  }>;
}

declare module "react-resizable-panels" {
  import type { ComponentType, HTMLAttributes } from "react";

  type PanelProps = HTMLAttributes<HTMLDivElement> & Record<string, unknown>;

  export const PanelGroup: ComponentType<PanelProps>;
  export const Panel: ComponentType<PanelProps>;
  export const PanelResizeHandle: ComponentType<PanelProps>;
}

interface ImportMetaEnv {
  VITE_FRONTEND_FORGE_API_KEY?: string;
  VITE_FRONTEND_FORGE_API_URL?: string;
  VITE_ANALYTICS_ENDPOINT?: string;
  VITE_ANALYTICS_WEBSITE_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace google {
  namespace maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      zoom?: number;
      center?: LatLngLiteral;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
      streetViewControl?: boolean;
      mapId?: string;
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
    }
  }
}

interface Window {
  google?: {
    maps: {
      Map: typeof google.maps.Map;
    };
  };
}
