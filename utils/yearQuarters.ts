import options from "./appSettingsOption";

export function getReorderedQuarters(selectedValue: string) {
  const idx = options.quarters.findIndex((q) => q.value === selectedValue);
  if (idx === -1) return options.quarters;
  const reordered = [0, 1, 2, 3].map((offset) => {
    const qIdx = (idx + offset) % 4;
    const orig = options.quarters[qIdx];
    return {
      ...orig,
      label: `Q${offset + 1}` + orig.label.slice(3),
    };
  });
  const custom = options.quarters.find((q) => q.value === 'custom');
  if (custom) reordered.push(custom);
  return reordered;
}