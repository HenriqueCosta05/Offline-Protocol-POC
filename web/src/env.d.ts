/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly PUBLIC_BRIDGE_URL?: string;
  readonly PUBLIC_MOCK_BRIDGE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
