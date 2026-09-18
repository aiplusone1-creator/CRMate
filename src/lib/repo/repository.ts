export interface Repository<T> {
  getAll(): Promise<T[]> | T[];
  getById(id: string): Promise<T | null> | (T | null);
  create(item: Omit<T, 'id'> & { id?: string }): Promise<T> | T;
  update(id: string, updates: Partial<T>): Promise<T | null> | (T | null);
  remove(id: string): Promise<boolean> | boolean;
  query(predicate: (item: T) => boolean): Promise<T[]> | T[];
}
