
export interface List {
  id: string;
  name: string;
  createdAt: number;
}

export interface ListItem {
  id: string;
  listId: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}
