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
declare module "embla-carousel-react";
declare module "cmdk";
declare module "vaul";
declare module "input-otp";

interface ImportMetaEnv {
  VITE_FRONTEND_FORGE_API_KEY?: string;
  VITE_FRONTEND_FORGE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace google {
  const maps: any;
}
