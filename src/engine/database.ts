import { supabase } from '../lib/supabase';

export interface IDataReader {
  read(): Promise<boolean>;
  getValue(columnName: string): unknown;
  getInt32(columnName: string): number;
  getString(columnName: string): string;
  close(): void;
}

export interface IDataTable {
  rows: Map<number, Record<string, unknown>>;
  columns: string[];
  rowCount: number;
  addRow(data: Record<string, unknown>): void;
  clear(): void;
}

export class SqlDataReader implements IDataReader {
  private rows: Record<string, unknown>[];
  private currentIndex: number;
  private currentRow: Record<string, unknown> | null;
  private closed: boolean;

  constructor(rows: Record<string, unknown>[]) {
    this.rows = rows;
    this.currentIndex = -1;
    this.currentRow = null;
    this.closed = false;
  }

  async read(): Promise<boolean> {
    if (this.closed) return false;
    this.currentIndex++;
    if (this.currentIndex < this.rows.length) {
      this.currentRow = this.rows[this.currentIndex];
      return true;
    }
    return false;
  }

  getValue(columnName: string): unknown {
    if (!this.currentRow) return null;
    return this.currentRow[columnName] ?? null;
  }

  getInt32(columnName: string): number {
    const val = this.getValue(columnName);
    return Number(val) || 0;
  }

  getString(columnName: string): string {
    const val = this.getValue(columnName);
    return String(val ?? '');
  }

  close(): void {
    this.closed = true;
    this.currentRow = null;
  }
}

export class DataTable implements IDataTable {
  rows: Map<number, Record<string, unknown>>;
  columns: string[];
  rowCount: number;

  constructor() {
    this.rows = new Map();
    this.columns = [];
    this.rowCount = 0;
  }

  addRow(data: Record<string, unknown>): void {
    if (this.columns.length === 0) {
      this.columns = Object.keys(data);
    }
    this.rows.set(this.rowCount, data);
    this.rowCount++;
  }

  clear(): void {
    this.rows.clear();
    this.columns = [];
    this.rowCount = 0;
  }
}

export class SqlCommand {
  private connectionString: string;
  private commandText: string;
  private parameters: Map<string, unknown>;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    this.commandText = '';
    this.parameters = new Map();
  }

  setCommandText(text: string): void {
    this.commandText = text;
  }

  addParameter(name: string, value: unknown): void {
    this.parameters.set(name, value);
  }

  async executeReader(): Promise<SqlDataReader> {
    let query = this.commandText;

    this.parameters.forEach((value, key) => {
      const placeholder = key.startsWith('@') ? key : `@${key}`;
      let replacement: string;

      if (typeof value === 'string') {
        replacement = `'${value.replace(/'/g, "''")}'`;
      } else if (value === null || value === undefined) {
        replacement = 'NULL';
      } else {
        replacement = String(value);
      }

      query = query.replace(new RegExp(placeholder, 'g'), replacement);
    });

    try {
      const { data, error } = await supabase.rpc('execute_sql', { query });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const rows = Array.isArray(data) ? data : [];
      return new SqlDataReader(rows);
    } catch (err) {
      throw new Error(`ExecuteReader failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async executeNonQuery(): Promise<number> {
    let query = this.commandText;

    this.parameters.forEach((value, key) => {
      const placeholder = key.startsWith('@') ? key : `@${key}`;
      let replacement: string;

      if (typeof value === 'string') {
        replacement = `'${value.replace(/'/g, "''")}'`;
      } else if (value === null || value === undefined) {
        replacement = 'NULL';
      } else {
        replacement = String(value);
      }

      query = query.replace(new RegExp(placeholder, 'g'), replacement);
    });

    try {
      const { data, error } = await supabase.rpc('execute_sql', { query });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return Array.isArray(data) ? data.length : 0;
    } catch (err) {
      throw new Error(`ExecuteNonQuery failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async executeScalar(): Promise<unknown> {
    const reader = await this.executeReader();
    if (await reader.read()) {
      const firstRow = (reader as any).currentRow;
      if (firstRow) {
        const firstValue = Object.values(firstRow)[0];
        reader.close();
        return firstValue;
      }
    }
    reader.close();
    return null;
  }
}

export class SqlConnection {
  private connectionString: string;
  public state: 'Closed' | 'Open';

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    this.state = 'Closed';
  }

  async open(): Promise<void> {
    this.state = 'Open';
  }

  close(): void {
    this.state = 'Closed';
  }

  createCommand(): SqlCommand {
    return new SqlCommand(this.connectionString);
  }
}

export class SqlDataAdapter {
  private command: SqlCommand;

  constructor(command: SqlCommand) {
    this.command = command;
  }

  async fill(dataTable: DataTable): Promise<number> {
    const reader = await this.command.executeReader();
    let count = 0;

    while (await reader.read()) {
      const row: Record<string, unknown> = {};
      const currentRow = (reader as any).currentRow;

      if (currentRow) {
        Object.keys(currentRow).forEach(key => {
          row[key] = currentRow[key];
        });
        dataTable.addRow(row);
        count++;
      }
    }

    reader.close();
    return count;
  }
}
