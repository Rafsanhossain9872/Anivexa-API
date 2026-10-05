const escapeText = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const timestamp = value => {
  const match = value.trim().match(/^(\d+):(\d{2}):(\d{2})[.,](\d{1,3})$/);
  if (!match) throw new Error('Invalid subtitle timestamp');
  return `${match[1].padStart(2, '0')}:${match[2]}:${match[3]}.${match[4].padEnd(3, '0')}`;
};

export function toWebVTT(input) {
  const text = input.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  if (text.trimStart().startsWith('WEBVTT')) return text;
  if (/^\[Events\]/m.test(text)) {
    let fields = ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];
    const cues = [];
    for (const line of text.split('\n')) {
      if (/^Format:/i.test(line)) fields = line.slice(line.indexOf(':') + 1).split(',').map(field => field.trim().toLowerCase());
      if (!/^Dialogue:/i.test(line)) continue;
      const values = line.slice(line.indexOf(':') + 1).trim().split(',');
      const textIndex = fields.indexOf('text');
      const content = values.slice(textIndex).join(',');
      if (textIndex < 0 || /\{[^}]*\\p[1-9]/.test(content)) continue;
      const caption = escapeText(content.replace(/\{[^}]*\}/g, '').replace(/\\[Nn]/g, '\n').replace(/\\h/g, ' '));
      cues.push(`${timestamp(values[fields.indexOf('start')])} --> ${timestamp(values[fields.indexOf('end')])}\n${caption}`);
    }
    if (!cues.length) throw new Error('No subtitle cues found');
    return `WEBVTT\n\n${cues.join('\n\n')}\n`;
  }
  if (/\d{2}:\d{2}:\d{2},\d{3}\s+-->/.test(text)) {
    return `WEBVTT\n\n${text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}\n`;
  }
  throw new Error('Unsupported subtitle format');
}
