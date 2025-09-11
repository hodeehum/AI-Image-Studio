export enum AppMode {
  Generate = 'GENERATE',
  Edit = 'EDIT',
}

export interface OriginalImage {
  file: File;
  dataUrl: string;
}

export interface EditedResult {
  imageUrl: string;
  text: string | null;
}

export type AspectRatio = '1:1' | '16:9' | '9:16';