/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

declare module 'pdf-parse' {
  function pdfParse(
    data: Buffer,
    options?: Record<string, unknown>
  ): Promise<{ text: string; numpages?: number; info?: Record<string, unknown> }>;
  export default pdfParse;
}

declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: unknown[];
  }
  type MammothInput = { path?: string; buffer?: Buffer; arrayBuffer?: ArrayBuffer | Uint8Array };
  export function extractRawText(input: MammothInput): Promise<MammothResult>;
  export function convertToHtml(input: MammothInput, options?: Record<string, unknown>): Promise<MammothResult>;
}
