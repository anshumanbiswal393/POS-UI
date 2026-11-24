import type { ReactNode } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface DataGridColumn<T = any> {
  key?: string;
  id?: string;
  header?: ReactNode | string;
  label?: string;
  width?: string | number;
  defaultWidth?: string | number;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  enableSorting?: boolean;
  filterable?: boolean;
  enableFiltering?: boolean;
  pinned?: "left" | "right" | false;
  hideable?: boolean;
  defaultVisible?: boolean;
  accessorKey?: keyof T | string;
  getValue?: (row: T) => any;
  filterValueAccessor?: (row: T) => any;
  render?: (value: any, row: T, index: number) => ReactNode;
  formatter?: (value: any, row: T, index?: number) => ReactNode | string;
  cell?: (info: { row: T; value: any; index: number }) => ReactNode;
  headerRender?: () => ReactNode;
}

export type PosDataGridColumn<T = any> = DataGridColumn<T>;

export interface ColumnSortState {
  columnKey: string;
  direction: "asc" | "desc";
}

export interface ColumnFilterState {
  columnKey: string;
  selectedValues: string[];
  searchQuery?: string;
}

export interface PosDataGridProps<T = any> {
  data: T[];
  columns: (DataGridColumn<T> | any)[];
  keyField?: keyof T | ((row: T) => string) | string;
  selectable?: boolean;
  enableSelection?: boolean;
  selectedRows?: T[];
  selectedRowIds?: string[];
  onSelectionChange?: ((selectedRows: any[]) => void) | ((selectedIds: string[]) => void);
  enablePagination?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  initialSort?: ColumnSortState;
  emptyMessage?: ReactNode;
  emptyState?: ReactNode;
  itemName?: string;
  loading?: boolean;
  isLoading?: boolean;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  toolbar?: ReactNode;
  dense?: boolean;
}

