export interface Tag {
  id: string;
  userId: string;
  key: string;
  displayName: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
}
