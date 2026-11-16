import { IAlertProps } from './alerts';

export type NotesAlertCategory =
  | 'NOTES_ADD_SUCCESS'
  | 'NOTES_ADD_FAILED'
  | 'NOTES_UPDATE_SUCCESS'
  | 'NOTES_UPDATE_FAILED'
  | 'NOTES_DELETE_SUCCESS'
  | 'NOTES_DELETE_FAILED';

export interface INotesAlert {
  alert: NotesAlertCategory;
  setAlert: (type: NotesAlertCategory) => void;
}

export interface BeforeDBNote {
  title: string;
  content: string;
}

export interface NoteItem extends BeforeDBNote {
  id: number;
  title: string;
  content: string;
}

export interface DeleteNoteDTO {
  id: number;
}

export enum NotesEvents {
  ADD_NOTE = 'forge-npwd:addNote',
  FETCH_ALL_NOTES = 'forge-npwd:fetchAllNotes',
  DELETE_NOTE = 'forge-npwd:deleteNote',
  UPDATE_NOTE = 'forge-npwd:updateNote',
  ADD_NOTE_EXPORT = 'forge-npwd:addNoteExport',
}

export interface AddNoteExportData {
  title?: string;
  content?: string;
}
