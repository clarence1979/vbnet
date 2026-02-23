let counter = 0;

export function generateId(): string {
  counter++;
  return `comp_${Date.now()}_${counter}`;
}

export function generateComponentName(type: string, existingNames: string[]): string {
  let index = 1;
  let name = `${type}${index}`;
  while (existingNames.includes(name)) {
    index++;
    name = `${type}${index}`;
  }
  return name;
}
