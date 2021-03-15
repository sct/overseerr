type AvailableColors =
  | 'black'
  | 'red'
  | 'darkred'
  | 'blue'
  | 'lightblue'
  | 'darkblue'
  | 'orange'
  | 'darkorange'
  | 'green'
  | 'lightgreen'
  | 'purple'
  | 'darkpurple'
  | 'yellow'
  | 'pink';

export const colorTones: Record<AvailableColors, [string, string]> = {
  red: ['991B1B', 'FCA5A5'],
  darkred: ['1F2937', 'F87171'],
  blue: ['032541', '01b4e4'],
  lightblue: ['1F2937', '60A5FA'],
  darkblue: ['1F2937', '2864d2'],
  orange: ['92400E', 'FCD34D'],
  lightgreen: ['065F46', '6EE7B7'],
  green: ['087d29', '21cb51'],
  purple: ['5B21B6', 'C4B5FD'],
  yellow: ['777e0d', 'e4ed55'],
  darkorange: ['552c01', 'd47c1d'],
  black: ['1F2937', 'D1D5DB'],
  pink: ['9D174D', 'F9A8D4'],
  darkpurple: ['480c8b', 'a96bef'],
};

export const genreColorMap: Record<number, [string, string]> = {
  0: colorTones.black,
  28: colorTones.red,
  12: colorTones.blue,
  16: colorTones.orange,
  35: colorTones.lightgreen,
  80: colorTones.darkblue,
  99: colorTones.green,
  18: colorTones.purple,
  10751: colorTones.yellow,
  14: colorTones.darkorange,
  36: colorTones.green,
  27: colorTones.black,
  10402: colorTones.blue,
  9648: colorTones.purple,
  10749: colorTones.pink,
  878: colorTones.lightblue,
  10770: colorTones.red,
  53: colorTones.darkpurple,
  10752: colorTones.darkred,
  37: colorTones.orange,
  10759: colorTones.blue, // Action & Adventure
  10762: colorTones.blue, // Kids
  10764: colorTones.red, // Reality
  10765: colorTones.lightblue, // Sci-Fi & Fantasy
  10766: colorTones.darkpurple, // Soap
  10767: colorTones.lightgreen, // Talk
  10768: colorTones.darkred, // War & Politics
};
