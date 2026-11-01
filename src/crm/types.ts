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

export interface PendingFollowUp {
  path: string;
  label: string;
  action: string;
  date: string;
}

export interface EntityFormResult {
  [key: string]: string;
}
