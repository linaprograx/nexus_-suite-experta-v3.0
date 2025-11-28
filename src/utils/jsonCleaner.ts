export function cleanJSON(rawText: string) {
  if (!rawText) return null;

  const first = rawText.indexOf("{");
  const last = rawText.lastIndexOf("}");

  if (first === -1 || last === -1) return null;

  let jsonString = rawText.slice(first, last + 1);

  jsonString = jsonString
    .replace(/,\\s*}/g, "}")
    .replace(/,\\s*]/g, "]")
    .replace(/“/g, '\"')
    .replace(/”/g, '\"')
    .replace(/´/g, "'")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON parsing failed after cleanup", e);
    return null;
  }
}
