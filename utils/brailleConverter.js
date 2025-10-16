import { spawn } from 'child_process';
import fs from 'fs';

// Simple fallback mapping for letters, numbers, and punctuation
export const fallbackBraille = (text) => {
  const map = {
    // Letters
    a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑',
    f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
    k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕',
    p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
    u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵',

    // Numbers
    '0': '⠚','1': '⠁','2':'⠃','3':'⠉','4':'⠙','5':'⠑','6':'⠋','7':'⠛','8':'⠓','9':'⠊',

    // Punctuation
    ' ': ' ', '.': '⠲', ',': '⠂', '?':'⠦','!':'⠖','-':'⠤','"':'⠶', '\'':'⠄',
    ':':'⠒',';':'⠆','/':'⠌','\\':'⠸','(':'⠶',')':'⠶','@':'⠈','#':'⠼','&':'⠯','*':'⠡','+':'⠬','=':'⠿','%':'⠨⠴','<':'⠣','>':'⠜','$':'⠈⠎'
  };

  return text
    .split('')
    .map(ch => map[ch.toLowerCase()])
    .filter(Boolean) // remove undefined (skip unknown chars)
    .join('');
};



// Convert using Liblouis G2 and Unicode Braille
export const convertToBrailleLiblouis = async (text) => {
  const louTranslate = "C:\\liblouis-3.35.0-win64\\bin\\lou_translate.exe";
  const table = "C:\\liblouis-3.35.0-win64\\share\\liblouis\\tables\\en-us-g2.ctb";

  return new Promise((resolve) => {
    if (!fs.existsSync(louTranslate) || !fs.existsSync(table)) {
      const fallback = fallbackBraille(text);
      return resolve({ g2: fallback, unicode: fallback });
    }

    // Spawn process for raw G2
    const rawProcess = spawn(louTranslate, [table]);
    let g2Output = '';
    rawProcess.stdout.on('data', data => g2Output += data.toString());
    rawProcess.stdin.write(text + '\n');
    rawProcess.stdin.end();

    rawProcess.on('close', () => {
      // Spawn process for Unicode Braille
      const unicodeProcess = spawn(louTranslate, ['--dotsIO', table]);
      let unicodeOutput = '';
      unicodeProcess.stdout.on('data', data => unicodeOutput += data.toString());
      unicodeProcess.stdin.write(text + '\n');
      unicodeProcess.stdin.end();

      unicodeProcess.on('close', () => {
        resolve({
          g2: g2Output.trim() || fallbackBraille(text),
          unicode: unicodeOutput.trim() || fallbackBraille(text)
        });
      });
    });
  });
};
