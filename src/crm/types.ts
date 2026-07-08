export interface EntityField {
  key: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  options?: string[];
  section?: string;
  allowCreateNew?: boolean;
  noPlaceholderOption?: boolean;
  inputType?: "date";
}

export interface EntityFormResult {
  [key: string]: string;
}
