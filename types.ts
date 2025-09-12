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
