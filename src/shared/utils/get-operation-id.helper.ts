export function GetOperationId(
  model: string,
  operation: string,
): {
  summary: string;
  operationId: string;
} {
  const summary = `${model} - ${operation}`;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  model = ToTitleCase(model).replace(/\s/g, '');
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  operation = ToTitleCase(operation).replace(/\s/g, '');

  return {
    summary,
    operationId: `${model}_${operation}`,
  };
}

function ToTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.replace(word[0], word[0].toUpperCase());
    })
    .join(' ');
}
